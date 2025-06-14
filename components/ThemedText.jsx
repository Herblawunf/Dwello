import { StyleSheet, Text } from "react-native";
import { useTheme } from "@/context/ThemeContext";

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "default",
  inverse = false,
  ...rest
}) {
  const theme = useTheme();
  const color = lightColor || darkColor || (inverse ? theme.colors.onPrimary : theme.colors.onBackground);

  const getTextStyle = () => {
    switch (type) {
      case "title":
        return {
          fontSize: theme.typography.fontSize.xxl,
          fontWeight: theme.typography.fontWeight.bold,
          lineHeight: theme.typography.lineHeight.xxl,
        };
      case "subtitle":
        return {
          fontSize: theme.typography.fontSize.lg,
          fontWeight: theme.typography.fontWeight.semiBold,
          lineHeight: theme.typography.lineHeight.lg,
        };
      case "subsubtitle":
        return {
          fontSize: theme.typography.fontSize.md,
          fontWeight: theme.typography.fontWeight.medium,
          lineHeight: theme.typography.lineHeight.md,
        };
      case "defaultSemiBold":
        return {
          fontSize: theme.typography.fontSize.md,
          fontWeight: theme.typography.fontWeight.semiBold,
          lineHeight: theme.typography.lineHeight.md,
        };
      case "link":
        return {
          fontSize: theme.typography.fontSize.md,
          color: theme.colors.primary,
          lineHeight: theme.typography.lineHeight.md,
        };
      default:
        return {
          fontSize: theme.typography.fontSize.md,
          lineHeight: theme.typography.lineHeight.md,
        };
    }
  };

  return (
    <Text
      style={[
        { color },
        getTextStyle(),
        style,
      ]}
      {...rest}
    />
  );
}
