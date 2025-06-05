import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import "react-native-reanimated";
import { useContext, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import {
  Provider as AuthProvider,
  Context as AuthContext,
} from "../context/AuthContext";

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
};

const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: "center" }}>
    <ActivityIndicator size="large" />
  </View>
);

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <AuthRouter />
      </AuthProvider>
    </ThemeProvider>
  );
}

function AuthRouter() {
  const router = useRouter();
  const { state, tryLocalLogin } = useContext(AuthContext);
  const { isSignedIn, landlord, hasAttemptedLocalLogin } = state;

  // Attempt silent login on mount
  useEffect(() => {
    tryLocalLogin();
  }, [tryLocalLogin]);

  // Handle navigation based on auth state
  useEffect(() => {
    if (!hasAttemptedLocalLogin) return;

    const route = isSignedIn
      ? landlord
        ? "/(landlord_tabs)"
        : "/(tenant_tabs)"
      : "/(auth)";

    router.replace(route);
  }, [isSignedIn, landlord, hasAttemptedLocalLogin, router]);

  if (!hasAttemptedLocalLogin) return <LoadingScreen />;

  return (
    <>
      {isSignedIn ? (
        landlord ? (
          <Stacks.Landlord />
        ) : (
          <Stacks.Tenant />
        )
      ) : (
        <Stacks.Auth />
      )}
    </>
  );
}
