import React, { useState, useContext, useEffect } from "react";
import { Text, StyleSheet, TouchableOpacity, SafeAreaView } from "react-native";
import { Context as AuthContext } from "../../context/AuthContext";
import AuthInput from "../../components/AuthInput";

const LoginScreen = () => {
  const {
    state: authState,
    login,
    clearErrorMessage,
  } = useContext(AuthContext);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.titleText}>Welcome!</Text>
      <Text style={styles.infoText}>Enter details to login</Text>
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
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontWeight: "600",
    fontSize: 40,
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
    fontSize: 16,
    marginBottom: 40,
  },
});

export default LoginScreen;
