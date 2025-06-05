import React from 'react';
import { Stack } from 'expo-router';

/**
 * This layout wraps ChatScreen (in index.jsx). 
 * Because this file is named `_layout.jsx`, Expo Router
 * knows not to create a bottom‐tab for “chat” anymore.
 */
export default function ChatLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // hides any default header from Expo Router
      }}
    >
      {/* Renders chat/index.jsx as the main (and only) screen under /chat */}
      <Stack.Screen name="index" />
    </Stack>
  );
}
