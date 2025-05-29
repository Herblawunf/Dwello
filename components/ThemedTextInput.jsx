import { TextInput } from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";
import { responsiveFontSize } from "@/tools/fontscaling";

export function ThemedTextInput({ style, lightColor, darkColor, ...rest }) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");
  const borderColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    "tint"
  );

  return (
    <TextInput
      style={[
        { color, borderColor, borderWidth: responsiveFontSize(2) },
        style,
      ]}
      placeholderTextColor={color}
      {...rest}
    />
  );
}
