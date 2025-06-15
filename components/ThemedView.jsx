import { View } from "react-native";
import { useTheme } from "@/context/ThemeContext";

export function ThemedView({ style, lightColor, darkColor, ...otherProps }) {
  const theme = useTheme();
  const backgroundColor = lightColor || darkColor || theme.colors.background;

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
