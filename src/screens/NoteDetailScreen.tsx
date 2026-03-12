import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  Text,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { getNote, updateNote, deleteNote, type Note } from "../db/notes";
import { TagInput } from "../components/TagInput";

type Props = NativeStackScreenProps<RootStackParamList, "NoteDetail">;

export function NoteDetailScreen({ route, navigation }: Props) {
  const { noteId } = route.params;
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);

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
    }
  }

  useEffect(() => {
    // Auto-save on blur
    const unsubscribe = navigation.addListener("beforeRemove", () => {
      if (note && (title !== note.title || content !== note.content || JSON.stringify(tags) !== JSON.stringify(note.tags))) {
        updateNote(noteId, { title, content, tags }).catch(console.error);
      }
    });
    return unsubscribe;
  }, [navigation, note, title, content, tags, noteId]);

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
          style={styles.content}
          value={content}
          onChangeText={setContent}
          placeholder="Start writing..."
          placeholderTextColor="#636366"
          multiline
          textAlignVertical="top"
        />
        <View style={styles.tagSection}>
          <Text style={styles.tagLabel}>Tags</Text>
          <TagInput tags={tags} onTagsChange={setTags} />
        </View>
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
  },
  tagLabel: {
    color: "#8E8E93",
    fontSize: 13,
    fontWeight: "500",
  },
});
