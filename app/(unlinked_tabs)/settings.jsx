import { useContext } from "react";
import { supabase } from "../../lib/supabase";
import { TouchableOpacity, Text, SafeAreaView, View, StyleSheet } from "react-native";
import { Context as AuthContext } from "@/context/AuthContext";

export default function SettingsScreen() {
  const { state: authState, signout } = useContext(AuthContext);
  
  const handleSignout = async () => {
    await supabase.auth.signOut();
    signout();
  };

  const settingsItems = [
    {
      title: "Account",
      items: [
        { label: "Profile", onPress: () => {} },
        { label: "Privacy", onPress: () => {} },
      ]
    },
    {
      title: "App",
      items: [
        { label: "Notifications", onPress: () => {} },
        { label: "About", onPress: () => {} },
      ]
    },
    {
      title: "Account",
      items: [
        { label: "Sign Out", onPress: handleSignout, isDestructive: true },
      ]
    }
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
                  itemIndex === section.items.length - 1 && styles.lastItem
                ]}
                onPress={item.onPress}
              >
                <Text style={[
                  styles.itemText,
                  item.isDestructive && styles.destructiveText
                ]}>
                  {item.label}
                </Text>
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
    backgroundColor: "#fff",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
    marginLeft: 15,
    marginBottom: 5,
    textTransform: "uppercase",
  },
  itemContainer: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e0e0e0",
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  itemText: {
    fontSize: 16,
    color: "#333",
  },
  destructiveText: {
    color: "#ff3b30",
  },
}); 