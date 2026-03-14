import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { getNote, updateNote, deleteNote, type Note } from "../db/notes";
import { updateLinksForNote, getOutgoingLinks, getBacklinks } from "../db/links";
import { syncNoteEmbedding } from "../db/embeddings";
import { TagInput } from "../components/TagInput";
import { LinkSuggestions } from "../components/LinkSuggestions";
import { useLinkSuggestions } from "../hooks/useLinkSuggestions";

type Props = NativeStackScreenProps<RootStackParamList, "NoteDetail">;

export function NoteDetailScreen({ route, navigation }: Props) {
  const { noteId } = route.params;
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [linkedNotes, setLinkedNotes] = useState<{ id: string; title: string }[]>([]);
  const [backlinks, setBacklinks] = useState<{ id: string; title: string }[]>([]);
  const contentInputRef = useRef<TextInput>(null);

  // Get AI-powered link suggestions
  const { suggestions, loading: suggestionsLoading, error: suggestionsError } = 
    useLinkSuggestions(noteId, title, content);

  useEffect(() => {
    loadNote();
  }, [noteId]);

  async function loadNote() {
    const n = await getNote(noteId);
    if (n) {
      setNote(n);
      setTitle(n.title);
      setContent(n.content);
      setTags(n.tags);
      
      // Load linked notes and backlinks
      const [outgoing, incoming] = await Promise.all([
        getOutgoingLinks(noteId),
        getBacklinks(noteId),
      ]);
      setLinkedNotes(outgoing);
      setBacklinks(incoming);
    }
  }

  useEffect(() => {
    // Auto-save on blur
    const unsubscribe = navigation.addListener("beforeRemove", async () => {
      if (note && (title !== note.title || content !== note.content || JSON.stringify(tags) !== JSON.stringify(note.tags))) {
        try {
          await updateNote(noteId, { title, content, tags });
          await updateLinksForNote(noteId, content);
          
          // Sync embedding in background (don't block navigation)
          syncNoteEmbedding(noteId).catch((error) => {
            console.error("Failed to sync embedding:", error);
          });
        } catch (error) {
          console.error("Failed to save note:", error);
        }
      }
    });
    return unsubscribe;
  }, [navigation, note, title, content, tags, noteId]);

  function handleAddLink(suggestedNoteId: string, suggestedTitle: string) {
    // Insert [[title]] at cursor position or end of content
    const linkText = `[[${suggestedTitle}]]`;
    
    // For simplicity, append to end with spacing
    const updatedContent = content.trim() + `\n\n${linkText}`;
    setContent(updatedContent);

    // Optionally focus the input
    contentInputRef.current?.focus();
  }

  function handleNavigateToNote(targetNoteId: string) {
    navigation.push("NoteDetail", { noteId: targetNoteId });
  }

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => null,
    });
  }, [navigation]);

  function handleDelete() {
    Alert.alert("Delete Note", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteNote(noteId);
          navigation.goBack();
        },
      },
    ]);
  }

  if (!note) return null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        <TextInput
          style={styles.title}
          value={title}
          onChangeText={setTitle}
          placeholder="Title"
          placeholderTextColor="#636366"
        />
        <TextInput
          ref={contentInputRef}
          style={styles.content}
          value={content}
          onChangeText={setContent}
          placeholder="Start writing..."
          placeholderTextColor="#636366"
          multiline
          textAlignVertical="top"
        />

        {/* AI Link Suggestions */}
        <LinkSuggestions
          suggestions={suggestions}
          loading={suggestionsLoading}
          error={suggestionsError}
          onAddLink={handleAddLink}
          onNavigateToNote={handleNavigateToNote}
        />

        <View style={styles.tagSection}>
          <Text style={styles.tagLabel}>Tags</Text>
          <TagInput tags={tags} onTagsChange={setTags} />
        </View>

        {/* Linked Notes */}
        {linkedNotes.length > 0 && (
          <View style={styles.linksSection}>
            <Text style={styles.linksLabel}>Linked Notes</Text>
            {linkedNotes.map((linkedNote) => (
              <TouchableOpacity
                key={linkedNote.id}
                style={styles.linkItem}
                onPress={() => navigation.push("NoteDetail", { noteId: linkedNote.id })}
              >
                <Text style={styles.linkTitle}>→ {linkedNote.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Backlinks */}
        {backlinks.length > 0 && (
          <View style={styles.linksSection}>
            <Text style={styles.linksLabel}>Backlinks ({backlinks.length})</Text>
            {backlinks.map((backlink) => (
              <TouchableOpacity
                key={backlink.id}
                style={styles.linkItem}
                onPress={() => navigation.push("NoteDetail", { noteId: backlink.id })}
              >
                <Text style={styles.linkTitle}>← {backlink.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 12,
    paddingVertical: 4,
  },
  content: {
    minHeight: 200,
    fontSize: 16,
    lineHeight: 24,
    color: "#EBEBF5",
    marginBottom: 16,
  },
  tagSection: {
    gap: 8,
    marginBottom: 16,
  },
  tagLabel: {
    color: "#8E8E93",
    fontSize: 13,
    fontWeight: "500",
  },
  linksSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 0.5,
    borderTopColor: "#2C2C2E",
  },
  linksLabel: {
    color: "#8E8E93",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  linkItem: {
    paddingVertical: 8,
  },
  linkTitle: {
    color: "#007AFF",
    fontSize: 15,
  },
});
