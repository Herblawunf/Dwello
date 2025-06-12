import { Tabs } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

export default function UnlinkedTabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="home" size={28} color={color} />
          ),
        }}
      />
    </Tabs>
  );
} 