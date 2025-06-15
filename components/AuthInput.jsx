import { useState } from "react";
import { View, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";

const MAX_CHARS = 40;

const AuthInput = ({
  username,
  setUsername,
  password,
  setPassword,
  theme,
}) => {
  const [isSecurePassword, setIsSecurePassword] = useState(true);

  const styles = StyleSheet.create({
    container: {
      width: "100%",
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.colors.divider,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      ...theme.elevation.sm,
    },
    inputField: {
      flex: 1,
      padding: theme.spacing.md,
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.onSurface,
    },
    eyeIcon: {
      padding: theme.spacing.sm,
    },
    icon: {
      color: theme.colors.placeholder,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <MaterialIcons
          name="person"
          size={24}
          color={theme.colors.placeholder}
          style={{ marginLeft: theme.spacing.sm }}
        />
        <TextInput
          style={styles.inputField}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="username"
          placeholder="Username"
          placeholderTextColor={theme.colors.placeholder}
          value={username}
          onChangeText={setUsername}
          maxLength={MAX_CHARS}
        />
      </View>

      <View style={styles.inputWrapper}>
        <MaterialIcons
          name="lock"
          size={24}
          color={theme.colors.placeholder}
          style={{ marginLeft: theme.spacing.sm }}
        />
        <TextInput
          secureTextEntry={isSecurePassword}
          style={styles.inputField}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
          placeholder="Password"
          placeholderTextColor={theme.colors.placeholder}
          value={password}
          onChangeText={setPassword}
          maxLength={MAX_CHARS}
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setIsSecurePassword(!isSecurePassword)}
        >
          <MaterialIcons
            name={isSecurePassword ? "visibility" : "visibility-off"}
            size={24}
            color={theme.colors.placeholder}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AuthInput;
