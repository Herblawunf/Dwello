import { Tabs } from "expo-router";
import React, { useState, useEffect, useRef } from "react";
import { Platform, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import DataProvider from "../components/DataProvider";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";

import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

// Global state for open extensions
let hasOpenExtensions = false;
export const setOpenExtensions = (value) => {
  hasOpenExtensions = value;
};

const TabBarIcon = ({ name, color, focused, showDot }) => {
  const theme = useTheme();
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ position: 'relative' }}>
        <MaterialIcons name={name} size={24} color={color} />
        {showDot && (
          <View
            style={{
              position: 'absolute',
              top: -2,
              right: -2,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: 'red',
            }}
          />
        )}
      </View>
      {focused && (
        <View
          style={{
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: theme.colors.onPrimary,
            marginTop: 4,
          }}
        />
      )}
    </View>
  );
};

// Create a separate component for the Properties tab icon
const PropertiesTabIcon = ({ color, focused }) => {
  const [showDot, setShowDot] = useState(hasOpenExtensions);

  useEffect(() => {
    // Update local state when global state changes
    setShowDot(hasOpenExtensions);
  }, [hasOpenExtensions]);

  return (
    <TabBarIcon 
      name="apartment" 
      color={color} 
      focused={focused} 
      showDot={showDot}
    />
  );
};

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = useTheme();
  const subscriptionRef = useRef(null);

  useEffect(() => {
    // Only set up subscription if it hasn't been set up before
    if (!subscriptionRef.current) {
      // Initial check for open extensions
      const checkOpenExtensions = async () => {
        const { data: openExtensions } = await supabase
          .from('rent_extensions')
          .select('status')
          .eq('status', 'open');

        setOpenExtensions(openExtensions && openExtensions.length > 0);
      };

      checkOpenExtensions();

      // Set up real-time subscription
      subscriptionRef.current = supabase
        .channel('rent_extensions_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'rent_extensions'
          },
          async () => {
            const { data: openExtensions } = await supabase
              .from('rent_extensions')
              .select('status')
              .eq('status', 'open');

            setOpenExtensions(openExtensions && openExtensions.length > 0);
          }
        )
        .subscribe();
    }

    // Cleanup subscription on unmount
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, []);

  return (
    <SafeAreaProvider>
      <DataProvider>
        <Tabs
          screenOptions={{
            tabBarStyle: {
              backgroundColor: theme.colors.primaryVariant,
              borderTopWidth: 0,
              elevation: 0,
              shadowOpacity: 0,
              height: 60,
              paddingBottom: 8,
              paddingTop: 8,
            },
            tabBarActiveTintColor: theme.colors.onPrimary,
            tabBarInactiveTintColor: theme.colors.onPrimary + '80',
            headerShown: false,
            tabBarButton: HapticTab,
            tabBarBackground: () => null,
            tabBarShowLabel: false,
          }}
        >
          {/* Home */}
          <Tabs.Screen
            name="index"
            options={{
              title: "Home",
              tabBarIcon: ({ color, focused }) => (
                <TabBarIcon name="home" color={color} focused={focused} />
              ),
            }}
          />

          {/* Insights */}
          <Tabs.Screen
            name="insights"
            options={{
              title: "Insights",
              tabBarIcon: ({ color }) => (
                <MaterialIcons name="bar-chart" size={28} color={color} />
              ),
            }}
          />

          {/* Upkeep / Calendar */}
          <Tabs.Screen
            name="upkeep"
            options={{
              title: "Upkeep",
              tabBarIcon: ({ color, focused }) => (
                <TabBarIcon name="calendar-today" color={color} focused={focused} />
              ),
            }}
          />

          {/* Requests */}
          <Tabs.Screen
            name="requests"
            options={{
              title: "Requests",
              tabBarIcon: ({ color }) => (
                <MaterialIcons name="build" size={28} color={color} />
              ),
            }}
          />

          {/* Properties */}
          <Tabs.Screen
            name="properties"
            options={{
              title: "Properties",
              tabBarIcon: ({ color, focused }) => (
                <PropertiesTabIcon color={color} focused={focused} />
              ),
            }}
          />

          {/* Add Property (modal) */}
          <Tabs.Screen
            name="add-property"
            options={{
              title: "Add Property",
              presentation: "modal",
              href: null,
            }}
          />

          {/* Chat (modal) */}
          <Tabs.Screen
            name="chat"
            options={{
              title: "Chat",
              presentation: "modal",
              href: null,
            }}
          />

          {/* Metric Details (modal) */}
          <Tabs.Screen
            name="metric_details"
            options={{
              href: null,
              presentation: 'modal',
            }}
          />

          {/* Settings */}
          <Tabs.Screen
            name="settings"
            options={{
              title: "Settings",
              tabBarIcon: ({ color, focused }) => (
                <TabBarIcon name="settings" color={color} focused={focused} />
              ),
            }}
          />

          {/* ChatWindow (modal) */}
          <Tabs.Screen
            name="ChatWindow"
            options={{
              href: null,
              presentation: 'modal',
            }}
          />

          {/* data_analytics_ (modal) */}
          <Tabs.Screen
            name="data_analytics_"
            options={{
              href: null,
              presentation: 'modal',
            }}
          />

          {/* detailed_analytics (modal) */}
          <Tabs.Screen
            name="detailed_analytics"
            options={{
              href: null,
              presentation: 'modal',
            }}
          />
        </Tabs>
      </DataProvider>
    </SafeAreaProvider>
  );
}
