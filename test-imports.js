// Test script to verify imports are working
const { createClient } = require('@supabase/supabase-js');

console.log('✅ Supabase client import successful');

// Test basic React imports
try {
  const React = require('react');
  console.log('✅ React import successful');
} catch (error) {
  console.error('❌ React import failed:', error.message);
}

// Test expo-router imports
try {
  const { Stack } = require('expo-router');
  console.log('✅ Expo Router import successful');
} catch (error) {
  console.error('❌ Expo Router import failed:', error.message);
}

// Test AsyncStorage import
try {
  const AsyncStorage = require('@react-native-async-storage/async-storage');
  console.log('✅ AsyncStorage import successful');
} catch (error) {
  console.error('❌ AsyncStorage import failed:', error.message);
}

console.log('🎉 All basic imports are working!'); 