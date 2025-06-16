import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import "react-native-reanimated";
import React, { useContext, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import {
  Provider as AuthProvider,
  Context as AuthContext,
} from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { analyticsApi } from '../lib/supabase';

// Stacks Configuration
const Stacks = {
  Auth: () => (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  ),
  Tenant: () => (
    <Stack>
      <Stack.Screen name="(tenant_tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  ),
  Landlord: () => (
    <Stack>
      <Stack.Screen name="(landlord_tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  ),
  Unlinked: () => (
    <Stack>
      <Stack.Screen name="(unlinked_tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  ),
};

const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: "center" }}>
    <ActivityIndicator size="large" />
  </View>
);

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  // Initialize analytics system
  useEffect(() => {
    const initAnalytics = async () => {
      try {
        console.log('Initializing analytics system...');
        const result = await analyticsApi.initializeAnalytics();
        if (result.success) {
          console.log('Analytics system initialized successfully');
        } else {
          console.error('Failed to initialize analytics system:', result.error);
          // Try to set up analytics directly as fallback
          await analyticsApi.setupPropertyAnalytics();
        }
      } catch (error) {
        console.error('Error initializing analytics:', error);
        // Try to set up analytics directly as fallback
        try {
          await analyticsApi.setupPropertyAnalytics();
        } catch (setupError) {
          console.error('Failed to set up analytics after initialization error:', setupError);
        }
      }
    };
    
    initAnalytics();
  }, []);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <ThemeProvider>
          <AuthProvider>
            <AuthRouter />
          </AuthProvider>
        </ThemeProvider>
      </NavigationThemeProvider>
    </GestureHandlerRootView>
  );
}

function AuthRouter() {
  const router = useRouter();
  const { state, tryLocalLogin } = useContext(AuthContext);
  const { isSignedIn, landlord, hasAttemptedLocalLogin, hasHouse } = state;

  // Attempt silent login on mount
  useEffect(() => {
    tryLocalLogin();
  }, [tryLocalLogin]);

  // Handle navigation based on auth state
  useEffect(() => {
    if (!hasAttemptedLocalLogin) return;

    const route = isSignedIn
      ? !!landlord
        ? "/(landlord_tabs)"
        : hasHouse
        ? "/(tenant_tabs)"
        : "/(unlinked_tabs)"
      : "/(auth)";

    router.replace(route);
  }, [isSignedIn, landlord, hasAttemptedLocalLogin, hasHouse, router]);

  if (!hasAttemptedLocalLogin) return <LoadingScreen />;

  return (
    <>
      {isSignedIn ? (
        landlord ? (
          <Stacks.Landlord />
        ) : hasHouse ? (
          <Stacks.Tenant />
        ) : (
          <Stacks.Unlinked />
        )
      ) : (
        <Stacks.Auth />
      )}
    </>
  );
}
