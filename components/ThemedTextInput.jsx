import { TextInput, StyleSheet } from "react-native";
import { useTheme } from "@/context/ThemeContext";

export function ThemedTextInput({ style, lightColor, darkColor, ...rest }) {
  const theme = useTheme();
  const color = lightColor || darkColor || theme.colors.onSurface;
  const borderColor = theme.colors.divider;

  return (
    <TextInput
      style={[
        styles.input,
        { 
          color,
          borderColor,
          fontSize: theme.typography.fontSize.md,
          backgroundColor: theme.colors.surface,
        },
        style,
      ]}
      placeholderTextColor={theme.colors.placeholder}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
});
