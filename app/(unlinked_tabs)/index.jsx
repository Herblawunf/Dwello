import React, { useState, useContext } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, TouchableWithoutFeedback, Keyboard, ActivityIndicator, Alert } from "react-native";
import { Context as AuthContext } from "../../context/AuthContext";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";

export default function UnlinkedHome() {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { state } = useContext(AuthContext);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!code || code.length !== 6) {
      Alert.alert("Error", "Please enter a valid 6-digit code");
      return;
    }

    setIsLoading(true);
    try {
      // First, find the house with the matching code
      const { data: house, error: houseError } = await supabase
        .from('houses')
        .select('house_id')
        .eq('code', parseInt(code))
        .single();

      if (houseError || !house) {
        throw new Error('Invalid house code');
      }

      // Update the tenant record with the house_id and has_house
      const { error: updateError } = await supabase
        .from('tenants')
        .update({
          house_id: house.house_id,
          has_house: true
        })
        .eq('tenant_id', state.userId);

      if (updateError) {
        throw new Error('Failed to link tenant to house');
      }

      // If successful, redirect to tenant tabs
      router.replace('/(tenant_tabs)');
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to verify code. Please try again.");
    } finally {
      setIsLoading(false);
      setCode(""); // Clear the input field
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Text style={styles.title}>Enter Code</Text>
        <TextInput
          style={styles.input}
          value={code}
          onChangeText={setCode}
          keyboardType="numeric"
          maxLength={6}
          placeholder="Enter 6-digit code"
          placeholderTextColor="#999"
          editable={!isLoading}
        />
        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Submit</Text>
          )}
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333",
    marginBottom: 30,
  },
  input: {
    width: "80%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 18,
    textAlign: "center",
    color: "#333",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    width: "80%",
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#999",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
}); 