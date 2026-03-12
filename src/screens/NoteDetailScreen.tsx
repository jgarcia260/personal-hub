import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { getNote, updateNote, deleteNote, type Note } from "../db/notes";

type Props = NativeStackScreenProps<RootStackParamList, "NoteDetail">;

export function NoteDetailScreen({ route, navigation }: Props) {
  const { noteId } = route.params;
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    loadNote();
  }, [noteId]);

  async function loadNote() {
    const n = await getNote(noteId);
    if (n) {
      setNote(n);
      setTitle(n.title);
      setContent(n.content);
    }
  }

  useEffect(() => {
    // Auto-save on blur
    const unsubscribe = navigation.addListener("beforeRemove", () => {
      if (note && (title !== note.title || content !== note.content)) {
        updateNote(noteId, { title, content }).catch(console.error);
      }
    });
    return unsubscribe;
  }, [navigation, note, title, content, noteId]);

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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
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
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: "#EBEBF5",
  },
});
