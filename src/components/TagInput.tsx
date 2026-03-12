import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from "react-native";

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
}

export function TagInput({ tags, onTagsChange }: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  function handleAddTag() {
    const trimmed = inputValue.trim().toLowerCase();
    if (!trimmed) return;
    if (tags.includes(trimmed)) {
      setInputValue("");
      return;
    }
    onTagsChange([...tags, trimmed]);
    setInputValue("");
  }

  function handleRemoveTag(tag: string) {
    onTagsChange(tags.filter((t) => t !== tag));
  }

  return (
    <View style={styles.container}>
      <View style={styles.tagList}>
        {tags.map((tag) => (
          <TouchableOpacity
            key={tag}
            style={styles.tag}
            onPress={() => handleRemoveTag(tag)}
          >
            <Text style={styles.tagText}>#{tag}</Text>
            <Text style={styles.removeIcon}>×</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={inputValue}
          onChangeText={setInputValue}
          placeholder="Add tag..."
          placeholderTextColor="#636366"
          onSubmitEditing={handleAddTag}
          returnKeyType="done"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {inputValue.trim().length > 0 && (
          <TouchableOpacity style={styles.addButton} onPress={handleAddTag}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  tagList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2C2C2E",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  tagText: {
    color: "#8E8E93",
    fontSize: 13,
    fontWeight: "500",
  },
  removeIcon: {
    color: "#636366",
    fontSize: 18,
    fontWeight: "300",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#1C1C1E",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: "#FFF",
  },
  addButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
