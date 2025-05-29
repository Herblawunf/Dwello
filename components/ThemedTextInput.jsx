import { TextInput } from "react-native";

import { useThemeColor } from "@/hooks/useThemeColor";

export function ThemedTextInput({ style, lightColor, darkColor, ...rest }) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");
  const placeholderTextColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    "text"
  );

  return (
    <TextInput
      style={[{ color }, style]}
      placeholderTextColor={placeholderTextColor}
      {...rest}
    />
  );
}
