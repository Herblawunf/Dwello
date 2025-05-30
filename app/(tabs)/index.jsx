import { Platform, StyleSheet, View } from "react-native";

import { MaterialIcons } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ThemedTouchableOpacity } from "@/components/ThemedTouchableOpacity";

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.innerContainer}>
        <ThemedText type="title">Balance Due</ThemedText>
        <ThemedText type="title" style={{ paddingLeft: "5%" }}>
          £500.00
        </ThemedText>
        <ThemedText type="subsubtitle">
          Rent due in 2 days (June 1, 2025)
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.innerContainer}>
        <ThemedText type="title">Splits</ThemedText>
        <ThemedTouchableOpacity
          onPress={() => {}}
          inverse={false}
          style={styles.button}
        >
          <ThemedView
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <ThemedText type="subsubtitle">3 Outstanding Expenses</ThemedText>
            <MaterialIcons name="arrow-forward" size={20} color="black" />
          </ThemedView>
        </ThemedTouchableOpacity>
      </ThemedView>
      <ThemedView style={styles.innerContainer}>
        <ThemedText type="title">Notifications</ThemedText>
      </ThemedView>
      <ThemedView style={styles.innerContainer}>
        <ThemedText type="title">Quick Actions</ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: "5%",
  },
  innerContainer: {
    flex: 1,
    paddingBottom: "5%",
  },
  button: {
    borderWidth: 0,
  },
});
