import { Tabs } from "expo-router";
import React from "react";
import { Platform, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";

import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

const TabBarIcon = ({ name, color, focused }) => {
  const theme = useTheme();
  return (
    <View style={{ alignItems: 'center' }}>
      <MaterialIcons name={name} size={24} color={color} />
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

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = useTheme();

  return (
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
            <TabBarIcon name="apartment" color={color} focused={focused} />
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
  );
}
