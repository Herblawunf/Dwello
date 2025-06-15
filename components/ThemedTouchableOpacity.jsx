import { TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "@/context/ThemeContext";

export function ThemedTouchableOpacity({
  style,
  lightColor,
  darkColor,
  inverse = true,
  ...rest
}) {
  const theme = useTheme();
  const backgroundColor = lightColor || darkColor || (inverse ? theme.colors.primary : theme.colors.surface);
  const borderColor = inverse ? theme.colors.primary : theme.colors.divider;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { 
          backgroundColor,
          borderColor,
        },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
