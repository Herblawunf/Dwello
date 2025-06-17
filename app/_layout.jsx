import React, { useEffect, useContext } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { Provider as AuthProvider, Context as AuthContext } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import DataProvider from './components/DataProvider';
import { supabase } from '@/lib/supabase';

// Loading component
const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: "center" }}>
    <ActivityIndicator size="large" />
  </View>
);

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

export default function RootLayout() {
  useEffect(() => {
    // Initialize Supabase and check connection
    const initializeApp = async () => {
      try {
        console.log('Initializing app...');
        
        // Test Supabase connection
        const { data, error } = await supabase
          .from('houses')
          .select('count')
          .limit(1);
        
        if (error) {
          console.error('Supabase connection error:', error);
        } else {
          console.log('✅ Supabase connected successfully');
        }
        
        // Check if house_analytics table exists and has data
        const { data: analyticsData, error: analyticsError } = await supabase
          .from('house_analytics')
          .select('count')
          .limit(1);
        
        if (analyticsError) {
          console.warn('house_analytics table not found or empty:', analyticsError);
        } else {
          console.log('✅ house_analytics table accessible');
        }
        
      } catch (error) {
        console.error('App initialization error:', error);
      }
    };
    
    initializeApp();
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider>
        <DataProvider>
          <AuthRouter />
          <StatusBar style="auto" />
        </DataProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
