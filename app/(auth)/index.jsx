import React, { useState, useContext } from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { Context as AuthContext } from "@/context/AuthContext";
import AuthInput from "@/components/AuthInput";
import { useTheme } from "@/context/ThemeContext";
import { MaterialIcons } from "@expo/vector-icons";

const LoginScreen = () => {
  const { state: authState, login } = useContext(AuthContext);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const theme = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.background,
      padding: theme.spacing.lg,
    },
    header: {
      alignItems: "center",
      marginBottom: theme.spacing.xl,
    },
    logo: {
      marginBottom: theme.spacing.md,
    },
    title: {
      fontSize: theme.typography.fontSize.xxl,
      fontWeight: "bold",
      color: theme.colors.primary,
      marginBottom: theme.spacing.xs,
    },
    subtitle: {
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.placeholder,
      textAlign: "center",
    },
    form: {
      width: "100%",
      maxWidth: 400,
    },
    errorContainer: {
      backgroundColor: theme.colors.error,
      padding: theme.spacing.sm,
      borderRadius: theme.borderRadius.sm,
      marginBottom: theme.spacing.md,
      flexDirection: "row",
      alignItems: "center",
    },
    errorText: {
      color: theme.colors.onError,
      fontSize: theme.typography.fontSize.sm,
      marginLeft: theme.spacing.sm,
    },
    button: {
      backgroundColor: theme.colors.primary,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      alignItems: "center",
      marginTop: theme.spacing.lg,
      ...theme.elevation.md,
    },
    buttonText: {
      color: theme.colors.onPrimary,
      fontSize: theme.typography.fontSize.lg,
      fontWeight: "600",
    },
    inputContainer: {
      marginBottom: theme.spacing.md,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons
          name="home"
          size={64}
          color={theme.colors.primary}
          style={styles.logo}
        />
        <Text style={styles.title}>Welcome to Dwello</Text>
        <Text style={styles.subtitle}>Sign in to manage your properties</Text>
      </View>

      <View style={styles.form}>
        {authState.errorMessage ? (
          <View style={styles.errorContainer}>
            <MaterialIcons
              name="error-outline"
              size={20}
              color={theme.colors.onError}
            />
            <Text style={styles.errorText}>{authState.errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.inputContainer}>
          <AuthInput
            username={username}
            password={password}
            setUsername={setUsername}
            setPassword={setPassword}
            theme={theme}
          />
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => login({ email: username, password })}
        >
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LoginScreen;
