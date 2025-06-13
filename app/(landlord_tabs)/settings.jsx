import { useContext, useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import {
  TouchableOpacity,
  Text,
  SafeAreaView,
  View,
  StyleSheet,
  TextInput,
  Alert,
} from "react-native";
import { Context as AuthContext } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

export default function SettingsScreen() {
  const { state: authState, signout } = useContext(AuthContext);
  const router = useRouter();
  const [defaultRentDelay, setDefaultRentDelay] = useState("");

  useEffect(() => {
    const fetchDefaultRentDelay = async () => {
      try {
        const { data, error } = await supabase.rpc("get_default_rent_delay", {
          p_landlord_id: authState.userId,
        });

        if (error) {
          console.log("Error fetching default rent delay:", error);
          return;
        }

        setDefaultRentDelay(data.toString());
      } catch (error) {
        console.log("Catch fetching default rent delay:", error);
      }
    };

    fetchDefaultRentDelay();
  }, [authState.userId]);

  const handleSignout = async () => {
    await supabase.auth.signOut();
    signout();
    console.log(authState.isSignedIn);
  };

  const handleSetDefaultRentDelay = async () => {
    try {
      const { data, error } = await supabase.rpc("set_default_rent_delay", {
        p_landlord_id: authState.userId,
        p_days: parseInt(defaultRentDelay),
      });

      if (error) {
        Alert.alert("Error", "Failed to update default rent delay");
        console.log("Error setting default rent delay:", error);
        return;
      }

      Alert.alert("Success", "Default rent delay updated successfully");
    } catch (error) {
      console.log("Catch setting default rent delay:", error);
      Alert.alert("Error", "An unexpected error occurred");
    }
  };

  const showInfo = () => {
    Alert.alert(
      "Default Rent Delay",
      "This sets the number of days tenants are allowed to be late with rent extensions over a 365-day period."
    );
  };

  const settingsItems = [
    {
      title: "Properties",
      items: [
        {
          label: "Add Property",
          onPress: () => router.push("/(landlord_tabs)/add-property"),
        },
      ],
    },
    {
      title: "Account",
      items: [
        { label: "Profile", onPress: () => {} },
        { label: "Privacy", onPress: () => {} },
      ],
    },
    {
      title: "Rent Settings",
      items: [
        {
          label: "Default Rent Delay",
          custom: (
            <View style={styles.rentDelayContainer}>
              <View style={styles.labelContainer}>
                <Text style={styles.inputLabel}>Days Allowed Late</Text>
                <MaterialIcons
                  name="info-outline"
                  size={20}
                  color="#8E8E93"
                  onPress={showInfo}
                  style={styles.infoIcon}
                />
              </View>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={defaultRentDelay}
                  onChangeText={setDefaultRentDelay}
                  placeholder="Enter days"
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSetDefaultRentDelay}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ),
        },
      ],
    },
    {
      title: "Account",
      items: [
        { label: "Sign Out", onPress: handleSignout, isDestructive: true },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {settingsItems.map((section, sectionIndex) => (
        <View key={sectionIndex} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.itemContainer}>
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                style={[
                  styles.item,
                  itemIndex === section.items.length - 1 && styles.lastItem,
                ]}
                onPress={item.onPress}
              >
                {item.custom ? (
                  item.custom
                ) : (
                  <Text
                    style={[
                      styles.itemText,
                      item.isDestructive && styles.destructiveText,
                    ]}
                  >
                    {item.label}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8E8E93",
    marginBottom: 8,
    marginLeft: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  itemContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  item: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E5EA",
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  itemText: {
    fontSize: 17,
    color: "#000000",
  },
  destructiveText: {
    color: "#FF3B30",
  },
  rentDelayContainer: {
    flexDirection: "column",
    gap: 8,
    paddingVertical: 8,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  inputLabel: {
    fontSize: 15,
    color: "#000000",
    marginRight: 8,
  },
  infoIcon: {
    padding: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 5,
    paddingHorizontal: 10,
    backgroundColor: "#f5f5f5",
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});
