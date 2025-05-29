import { StyleSheet, Text, useColorScheme } from "react-native";

import { useThemeColor } from "@/hooks/useThemeColor";
import { responsiveFontSize } from "@/tools/fontscaling.js";

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "default",
  inverse = false,
  ...rest
}) {
  const colorScheme = useColorScheme();
  const defaultColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    "text"
  );

  // Manually fetch inverse colour scheme
  const color = inverse
    ? colorScheme === "light"
      ? darkColor
      : lightColor
    : defaultColor;

  return (
    <Text
      style={[
        { color },
        type === "default" ? styles.default : undefined,
        type === "title" ? styles.title : undefined,
        type === "defaultSemiBold" ? styles.defaultSemiBold : undefined,
        type === "subtitle" ? styles.subtitle : undefined,
        type === "subsubtitle" ? styles.subsubtitle : undefined,
        type === "link" ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: responsiveFontSize(16),
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: responsiveFontSize(16),
    lineHeight: 24,
    fontWeight: "600",
  },
  title: {
    fontSize: responsiveFontSize(32),
    fontWeight: "bold",
    lineHeight: 32,
  },
  subtitle: {
    fontSize: responsiveFontSize(20),
    fontWeight: "bold",
  },
  subsubtitle: {
    fontSize: responsiveFontSize(16),
  },
  link: {
    lineHeight: 30,
    fontSize: responsiveFontSize(16),
    color: "#0a7ea4",
  },
});
