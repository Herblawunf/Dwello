import { useState } from "react";
import { TextInput, View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const AuthInput = ({ username, setUsername, password, setPassword }) => {
  const [isSecurePassword, setIsSecurePassword] = useState(true);
  const [passwordIcon, setPasswordIcon] = useState("eye");

  const handleShowPassword = () => {
    setIsSecurePassword(!isSecurePassword);
    passwordIcon === "eye"
      ? setPasswordIcon("eye-off")
      : setPasswordIcon("eye");
  };

  return (
    <View>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.inputField}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="username"
          placeholder="Username"
          placeholderTextColor="white"
          value={username}
          onChangeText={setUsername}
          maxLength={25}
        />
      </View>
      <View style={styles.inputContainer}>
        <TextInput
          secureTextEntry={isSecurePassword}
          style={styles.inputField}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
          placeholder="Password"
          placeholderTextColor="white"
          value={password}
          onChangeText={setPassword}
          maxLength={25}
        />
        <TouchableOpacity onPress={handleShowPassword}>
          <Ionicons name={passwordIcon} size={25} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    overflow: "hidden",
    width: "80%",
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
    paddingHorizontal: 10,
  },
  inputField: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    color: "white",
    fontSize: 20,
    fontWeight: "600",
    width: "90%",
  },
});

export default AuthInput;
