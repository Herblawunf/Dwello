import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import DataProvider from "./components/DataProvider";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <DataProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: Platform.select({
            ios: {
              position: "absolute",
            },
            default: {},
          }),
        }}
      >
        {/* Home */}
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="home" size={28} color={color} />
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
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="calendar-today" size={28} color={color} />
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
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="apartment" size={28} color={color} />
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
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="settings" size={28} color={color} />
            ),
          }}
        />

        {/* Data Analytics (modal) */}
        <Tabs.Screen
          name="data_analytics_"
          options={{
            title: "Data Analytics",
            presentation: "modal",
            href: null,
          }}
        />

        {/* Detailed Analytics (modal) */}
        <Tabs.Screen
          name="detailed_analytics"
          options={{
            title: "Detailed Analytics",
            presentation: "modal",
            href: null,
          }}
        />

        {/* Chat Window (modal) */}
        <Tabs.Screen
          name="ChatWindow"
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
            title: "Metric Details",
            presentation: "modal",
            href: null,
          }}
        />

        {/* Components - Hide from tabs */}
        <Tabs.Screen
          name="components"
          options={{
            href: null,
            presentation: "modal",
          }}
        />

        {/* NotionCalendar component - explicitly hide */}
        <Tabs.Screen
          name="components/NotionCalendar"
          options={{
            href: null,
            presentation: "modal",
          }}
        />
      </Tabs>
    </DataProvider>
  );
}
