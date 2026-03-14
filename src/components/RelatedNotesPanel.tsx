import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";

interface RelatedNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  score: number;
}

interface RelatedNotesPanelProps {
  relatedNotes: RelatedNote[];
  loading: boolean;
  onNotePress: (noteId: string) => void;
}

export function RelatedNotesPanel({
  relatedNotes,
  loading,
  onNotePress,
}: RelatedNotesPanelProps) {
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Related Notes</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
        </View>
      </View>
    );
  }

  if (relatedNotes.length === 0) {
    return null; // Don't show panel if no related notes
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Related Notes</Text>
        <Text style={styles.badge}>{relatedNotes.length}</Text>
      </View>
      <ScrollView
        style={styles.notesList}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {relatedNotes.map((note) => (
          <TouchableOpacity
            key={note.id}
            style={styles.noteCard}
            onPress={() => onNotePress(note.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.noteTitle} numberOfLines={1}>
              {note.title}
            </Text>
            <Text style={styles.notePreview} numberOfLines={2}>
              {note.content}
            </Text>
            {note.tags.length > 0 && (
              <View style={styles.tagContainer}>
                {note.tags.slice(0, 3).map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                ))}
                {note.tags.length > 3 && (
                  <Text style={styles.moreTagsText}>
                    +{note.tags.length - 3}
                  </Text>
                )}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1C1C1E",
    borderTopWidth: 0.5,
    borderTopColor: "#2C2C2E",
    maxHeight: 280,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#2C2C2E",
  },
  headerText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600",
  },
  badge: {
    backgroundColor: "#007AFF",
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: "hidden",
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  notesList: {
    flex: 1,
  },
  noteCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#2C2C2E",
  },
  noteTitle: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  notePreview: {
    color: "#8E8E93",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  tag: {
    backgroundColor: "#2C2C2E",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    color: "#007AFF",
    fontSize: 12,
  },
  moreTagsText: {
    color: "#636366",
    fontSize: 12,
  },
});
