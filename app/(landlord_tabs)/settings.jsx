import { useContext } from "react";
import { supabase } from "../../lib/supabase";
import { TouchableOpacity, Text, SafeAreaView, View, StyleSheet } from "react-native";
import { Context as AuthContext } from "@/context/AuthContext";
import { useRouter } from "expo-router";

export default function SettingsScreen() {
  const { state: authState, signout } = useContext(AuthContext);
  const router = useRouter();
  
  const handleSignout = async () => {
    await supabase.auth.signOut();
    signout();
    console.log(authState.isSignedIn);
  };

  const settingsItems = [
    {
      title: "Properties",
      items: [
        { label: "Add Property", onPress: () => router.push("/(landlord_tabs)/add-property") },
      ]
    },
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
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
    marginLeft: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  item: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  itemText: {
    fontSize: 17,
    color: '#000000',
  },
  destructiveText: {
    color: '#FF3B30',
  },
});
