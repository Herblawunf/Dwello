import { Stack } from "expo-router";

export default function ChatLayout() {
  return (
    <Stack screenOptions={{
      presentation: "modal",
      animation: "slide_from_bottom",
      headerShown: false,
    }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
} 