import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Get Supabase credentials from app config
const supabaseUrl = Constants.expoConfig.extra.supabaseUrl;
const supabaseAnonKey = Constants.expoConfig.extra.supabaseAnonKey;

// If anonKey is not set, provide instructions
if (!supabaseAnonKey) {
  console.warn(
    "Supabase Anon Key is not set. Please set EXPO_PUBLIC_SUPABASE_KEY in your environment or app.config.js"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Note: The old analyticsApi helper functions have been removed.
// All analytics data is now fetched directly from the house_analytics and houses tables
// in the DataProvider component using direct Supabase queries.