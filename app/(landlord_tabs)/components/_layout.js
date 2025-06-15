import { Stack } from 'expo-router';
import React from 'react';

// This layout file prevents the components directory from being shown in the tab bar
export default function ComponentsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'modal',
      }}
    />
  );
} 