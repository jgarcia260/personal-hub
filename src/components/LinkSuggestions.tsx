/**
 * Link Suggestions Component
 * Displays AI-powered note link suggestions
 */

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import type { LinkSuggestion } from "../hooks/useLinkSuggestions";

interface LinkSuggestionsProps {
  suggestions: LinkSuggestion[];
  loading: boolean;
  error: string | null;
  onAddLink: (noteId: string, title: string) => void;
  onNavigateToNote: (noteId: string) => void;
}

export function LinkSuggestions({
  suggestions,
  loading,
  error,
  onAddLink,
  onNavigateToNote,
}: LinkSuggestionsProps) {
  // Don't render if nothing to show
  if (!loading && suggestions.length === 0 && !error) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>💡 Related notes you might link:</Text>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#007AFF" size="small" />
          <Text style={styles.loadingText}>Finding related notes...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      {!loading && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {suggestions.map((suggestion) => (
            <View key={suggestion.noteId} style={styles.suggestionItem}>
              <TouchableOpacity
                style={styles.titleContainer}
                onPress={() => onNavigateToNote(suggestion.noteId)}
              >
                <Text style={styles.suggestionTitle}>
                  → {suggestion.title}
                </Text>
                <Text style={styles.scoreText}>
                  {Math.round(suggestion.score * 100)}% match
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => onAddLink(suggestion.noteId, suggestion.title)}
              >
                <Text style={styles.addButtonText}>Add [[link]]</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#1C1C1E",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2C2C2E",
  },
  header: {
    color: "#8E8E93",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 12,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  loadingText: {
    color: "#8E8E93",
    fontSize: 14,
  },
  errorContainer: {
    paddingVertical: 8,
  },
  errorText: {
    color: "#FF453A",
    fontSize: 13,
  },
  suggestionsContainer: {
    gap: 12,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  titleContainer: {
    flex: 1,
  },
  suggestionTitle: {
    color: "#007AFF",
    fontSize: 15,
    marginBottom: 2,
  },
  scoreText: {
    color: "#636366",
    fontSize: 12,
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#007AFF",
    borderRadius: 6,
  },
  addButtonText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "600",
  },
});
