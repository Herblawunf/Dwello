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
      <Stack.Screen name="(tenant_tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

function LandlordStack() {
  return (
    <Stack>
      <Stack.Screen name="(landlord_tabs)" options={{ headerShown: false }} />
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

  console.log('AuthState:', authState);

  useEffect(() => {
    tryLocalLogin();
  }, []);

  // redirect the very moment we know we're signed in
  useEffect(() => {
    if (authState.isSignedIn) {
      console.log('User is signed in, redirecting to tabs');
      if (authState.landlord) {
        console.log('User is a landlord, redirecting to landlord tabs');
        router.replace("/(landlord_tabs)");
      }
      else {
        console.log('User is a tenant, redirecting to tenant tabs');
        router.replace("/(tenant_tabs)");
      }
    }
  }, [authState.isSignedIn]);

  if (!authState.hasAttemptedLocalLogin) {
    console.log('Showing loading screen');
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Render AppStack if signed in, AuthStack if not signed in
  if (authState.isSignedIn) {
    console.log('Rendering AppStack');
    return <AppStack />;
  } else {

    console.log('Rendering AuthStack');
    return <AuthStack />;
    
  }
}