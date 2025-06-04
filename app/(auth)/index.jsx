import React, { useState, useContext } from "react";
import { Text, StyleSheet, TouchableOpacity } from "react-native";
import { Context as AuthContext } from "@/context/AuthContext";
import AuthInput from "@/components/AuthInput";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ThemedTouchableOpacity } from "@/components/ThemedTouchableOpacity";
import { responsiveFontSize } from "@/tools/fontscaling";

const LoginScreen = () => {
  const { state: authState, login } = useContext(AuthContext);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.titleText} type="subtitle">
        Login
      </ThemedText>
      <ThemedText style={styles.infoText} type="subsubtitle">
        Enter your details to login
      </ThemedText>
      <AuthInput
        style={styles.authInput}
        username={username}
        password={password}
        setUsername={setUsername}
        setPassword={setPassword}
      />
      {authState.errorMessage ? (
        <Text style={styles.errorMessage}>{authState.errorMessage}</Text>
      ) : null}
      <ThemedTouchableOpacity
        style={styles.button}
        onPress={() => login({ email: username, password })}
      >
        <ThemedText style={styles.buttonText} inverse>
          Login
        </ThemedText>
      </ThemedTouchableOpacity>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    marginTop: 20,
  },
  button: {
    padding: "3%",
    borderRadius: responsiveFontSize(10),
    alignItems: "center",
    marginBottom: "15%",
    width: "85%",
  },
  input: {
    borderWidth: 1,
    padding: 10,
    width: "80%",
    fontSize: 20,
    borderRadius: responsiveFontSize(10),
    margin: 10,
    fontWeight: "bold",
  },
  buttonText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  errorMessage: {
    fontSize: 16,
    color: "red",
  },
  infoText: {
    marginBottom: 40,
  },
  authInput: {
    borderRadius: responsiveFontSize(10),
  },
});

export default LoginScreen;
