import React, { useState, useContext, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, TouchableWithoutFeedback, Keyboard, ActivityIndicator, Alert } from "react-native";
import { Context as AuthContext } from "../../context/AuthContext";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "../../lib/supabase";
import { MaterialIcons } from "@expo/vector-icons";

export default function UnlinkedHome() {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const { state } = useContext(AuthContext);
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    // Check if we're returning from a confirmation
    if (params.confirmed === 'true' && params.houseId) {
      handleConfirmLink(params.houseId);
    }
  }, [params]);

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
        .select('house_id, postcode')
        .eq('code', parseInt(code))
        .single();

      if (houseError || !house) {
        throw new Error('Invalid house code');
      }

      // Navigate to the confirmation modal
      router.push({
        pathname: "/confirm-house-modal",
        params: {
          postcode: house.postcode,
          houseId: house.house_id
        }
      });
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to verify code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmLink = async (houseId) => {
    setIsLoading(true);
    try {
      // Update the tenant record with the house_id and has_house
      const { error: updateError } = await supabase
        .from('tenants')
        .update({
          house_id: houseId,
          has_house: true
        })
        .eq('tenant_id', state.userId);

      if (updateError) {
        throw new Error('Failed to link tenant to house');
      }

      // If successful, redirect to tenant tabs
      router.replace('/(tenant_tabs)');
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to link to house. Please try again.");
    } finally {
      setIsLoading(false);
      setCode(""); // Clear the input field
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Enter Code</Text>
          <View style={styles.tooltipWrapper}>
            {showTooltip && (
              <View style={styles.tooltipBubble}>
                <Text style={styles.tooltipText}>
                  Ask your landlord for your house code and enter it to link to the house
                </Text>
                <View style={styles.tooltipArrow} />
              </View>
            )}
            <TouchableOpacity 
              style={styles.tooltipButton}
              onPress={() => setShowTooltip(!showTooltip)}
            >
              <MaterialIcons name="help-outline" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333",
    marginRight: 8,
  },
  tooltipWrapper: {
    position: 'relative',
  },
  tooltipButton: {
    padding: 4,
  },
  tooltipBubble: {
    position: 'absolute',
    bottom: 30,
    right: -85,
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 8,
    width: 200,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tooltipText: {
    color: 'white',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
  tooltipArrow: {
    position: 'absolute',
    bottom: -6,
    right: 85,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#333',
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