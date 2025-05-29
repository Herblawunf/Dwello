import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, router } from "expo-router";
import "react-native-reanimated";
import { useContext, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";

import { useColorScheme } from "@/hooks/useColorScheme";
import {
  Provider as AuthProvider,
  Context as AuthContext,
} from "../context/AuthContext";

function AuthStack() {
  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

function AppStack() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ThemeProvider>
  );
}

function RootLayoutNav() {
  const { state: authState, tryLocalLogin } = useContext(AuthContext);

  useEffect(() => {
    tryLocalLogin();
  }, []);

  // redirect the very moment we know we're signed in
  useEffect(() => {
    console.log(authState.isSignedIn);
    if (authState.isSignedIn) {
      router.replace("/(tabs)");
    }
  }, [authState.isSignedIn]);

  console.log(authState.isSignedIn);
  if (!authState.hasAttemptedLocalLogin) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // while NOT signed-in just keep the auth stack mounted
  console.log(authState.isSignedIn);
  return <AuthStack />;
}
