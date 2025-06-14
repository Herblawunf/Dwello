import { Stack } from "expo-router";
import { useTheme } from "@/context/ThemeContext";

export default function AuthLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
        animation: "fade",
      }}
    >
      <Stack.Screen 
        name="index"
        options={{
          animation: "fade",
        }}
      />
      {/* <Stack.Screen 
        name="register"
        options={{
          animation: "fade",
        }}
      /> */}
    </Stack>
  );
}
