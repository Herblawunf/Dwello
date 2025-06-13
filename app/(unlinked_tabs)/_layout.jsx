import { Tabs } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

export default function UnlinkedTabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Enter Code",
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarLabel: "Settings",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="settings" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="confirm-house-modal"
        options={{
          title: "Confirm House",
          href: null, // This prevents the screen from showing in the tab bar
          presentation: 'modal',
        }}
      />
    </Tabs>
  );
} 