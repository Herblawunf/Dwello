import { TouchableOpacity } from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";
import { responsiveFontSize } from "@/tools/fontscaling";

export function ThemedTouchableOpacity({
  style,
  lightColor,
  darkColor,
  inverse = true,
  ...rest
}) {
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    "background",
    inverse
  );

  const borderColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    "tint",
    inverse
  );

  return (
    <TouchableOpacity
      style={[
        { backgroundColor, borderColor, borderWidth: responsiveFontSize(2) },
        style,
      ]}
      {...rest}
    />
  );
}
