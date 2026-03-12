import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { NoteListScreen } from "./src/screens/NoteListScreen";
import { CaptureScreen } from "./src/screens/CaptureScreen";
import { NoteDetailScreen } from "./src/screens/NoteDetailScreen";
import type { RootStackParamList } from "./src/navigation/types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: "#1C1C1E" },
            headerTintColor: "#FFF",
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen
            name="NoteList"
            component={NoteListScreen}
            options={{ title: "Notes" }}
          />
          <Stack.Screen
            name="Capture"
            component={CaptureScreen}
            options={{ title: "New Note", presentation: "modal" }}
          />
          <Stack.Screen
            name="NoteDetail"
            component={NoteDetailScreen}
            options={{ title: "" }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
