import React, { useState, useContext } from "react";
import { Text, StyleSheet, TouchableOpacity } from "react-native";
import { Context as AuthContext } from "@/context/AuthContext";
import AuthInput from "@/components/AuthInput";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

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
        username={username}
        password={password}
        setUsername={setUsername}
        setPassword={setPassword}
      />
      {authState.errorMessage ? (
        <Text style={styles.errorMessage}>{authState.errorMessage}</Text>
      ) : null}
      <TouchableOpacity
        style={styles.button}
        onPress={() => login({ username, password })}
      >
        <ThemedText style={styles.buttonText}>Login</ThemedText>
      </TouchableOpacity>
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
    borderRadius: 5,
    width: 200,
    alignItems: "center",
    marginTop: 40,
    marginBottom: "15%",
    backgroundColor: "white",
  },
  input: {
    borderWidth: 1,
    padding: 10,
    width: "80%",
    fontSize: 20,
    borderRadius: 10,
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
});

export default LoginScreen;
