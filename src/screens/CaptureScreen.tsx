import React, { useState, useRef, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { useNotes } from "../hooks/useNotes";
import { useRelatedNotes } from "../hooks/useRelatedNotes";
import { TagInput } from "../components/TagInput";
import { RelatedNotesPanel } from "../components/RelatedNotesPanel";

type Props = NativeStackScreenProps<RootStackParamList, "Capture">;

export function CaptureScreen({ navigation }: Props) {
  const [text, setText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);
  const { addNote } = useNotes();
  const { relatedNotes, loading: relatedLoading } = useRelatedNotes(text, tags, 300);

  useEffect(() => {
    // Auto-focus on mount — brain dump ready
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  async function handleSave() {
    const trimmed = text.trim();
    if (!trimmed) return;

    const note = await addNote(trimmed, undefined, tags);
    setText("");
    setTags([]);
    navigation.navigate("NoteList");
  }

  function handleRelatedNotePress(noteId: string) {
    // Navigate to the related note
    navigation.navigate("NoteDetail", { noteId });
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={88}
    >
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="What's on your mind?"
          placeholderTextColor="#636366"
          multiline
          textAlignVertical="top"
          autoFocus
        />
        <View style={styles.tagSection}>
          <Text style={styles.tagLabel}>Tags</Text>
          <TagInput tags={tags} onTagsChange={setTags} />
        </View>
      </ScrollView>
      <RelatedNotesPanel
        relatedNotes={relatedNotes}
        loading={relatedLoading}
        onNotePress={handleRelatedNotePress}
      />
      <View style={styles.footer}>
        <Text style={styles.hint}>
          First line becomes the title
        </Text>
        <TouchableOpacity
          style={[styles.saveButton, !text.trim() && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!text.trim()}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
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
  },
  input: {
    minHeight: 200,
    padding: 16,
    fontSize: 17,
    lineHeight: 26,
    color: "#FFF",
  },
  tagSection: {
    padding: 16,
    paddingTop: 0,
    gap: 8,
  },
  tagLabel: {
    color: "#8E8E93",
    fontSize: 13,
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderTopWidth: 0.5,
    borderTopColor: "#2C2C2E",
  },
  hint: {
    color: "#636366",
    fontSize: 13,
  },
  saveButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
