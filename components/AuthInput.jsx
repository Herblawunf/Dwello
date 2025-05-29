import { useState } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedTextInput } from "@/components/ThemedTextInput";
import { ThemedTouchableOpacity } from "@/components/ThemedTouchableOpacity";
import { useThemeColor } from "@/hooks/useThemeColor";

const MAX_CHARS = 40;

const AuthInput = ({
  style,
  lightColor,
  darkColor,
  username,
  setUsername,
  password,
  setPassword,
}) => {
  const [isSecurePassword, setIsSecurePassword] = useState(true);
  const [passwordIcon, setPasswordIcon] = useState("eye");

  const handleShowPassword = () => {
    setIsSecurePassword(!isSecurePassword);
    passwordIcon === "eye"
      ? setPasswordIcon("eye-off")
      : setPasswordIcon("eye");
  };

  const iconColour = useThemeColor(
    { light: lightColor, dark: darkColor },
    "icon"
  );

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <ThemedTextInput
          style={[styles.inputField, style]}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="username"
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          maxLength={MAX_CHARS}
        />
      </View>

      <View style={styles.inputWrapper}>
        <ThemedTextInput
          secureTextEntry={isSecurePassword}
          style={[styles.inputField, style]}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          maxLength={MAX_CHARS}
        />
        <ThemedTouchableOpacity
          style={styles.eyeIcon}
          onPress={handleShowPassword}
        >
          <Ionicons name={passwordIcon} size={25} color={iconColour} />
        </ThemedTouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "85%",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: 15,
    paddingRight: 10, // space for icon in password field
  },
  inputField: {
    flex: 1,
    padding: 10,
    borderWidth: 0, // remove individual border
  },
  eyeIcon: {
    position: "absolute",
    right: 10,
  },
});

export default AuthInput;
