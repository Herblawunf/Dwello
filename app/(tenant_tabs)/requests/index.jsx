import { useState, useCallback, useContext } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Context as AuthContext } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

export default function Requests() {
  const [activeTab, setActiveTab] = useState("pending");
  const insets = useSafeAreaInsets();
  const [requests, setRequests] = useState([]);
  const {
    state: { userId },
  } = useContext(AuthContext);

  const getHouseRequests = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc("get_house_requests", {
        p_tenant_id: userId,
      });
      if (data) {
        setRequests(data);
        console.log(data);
        return;
      }
      console.error(error);
    } catch (error) {
      console.error(error);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      getHouseRequests();
    }, [getHouseRequests])
  );

  const getPriorityText = (priority) => {
    switch (priority) {
      case 0:
        return { text: "Low Priority", color: "#4CAF50" };
      case 1:
        return { text: "Medium Priority", color: "#FFC107" };
      case 2:
        return { text: "High Priority", color: "#F44336" };
      default:
        return { text: "Unknown Priority", color: "#9E9E9E" };
    }
  };

  const renderRequest = ({ item }) => (
    <View style={styles.requestItem}>
      <View style={styles.requestHeader}>
        <Text
          style={[
            styles.priorityText,
            { color: getPriorityText(item.priority).color },
          ]}
        >
          {getPriorityText(item.priority).text}
        </Text>
        <Text style={styles.dateText}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
      <Text style={styles.description}>{item.description}</Text>
      <View style={styles.requestDetails}>
        <Text style={styles.requestInfo}>
          By: {item.poster_first_name} {item.poster_last_name}
        </Text>
      </View>
      <View style={styles.requestFooter}>
        <TouchableOpacity style={styles.footerButton} onPress={() => {}}>
          <MaterialIcons name="comment" size={20} color="#757575" />
          <Text style={styles.footerButtonText}>Comments</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerButton} onPress={() => {}}>
          <MaterialIcons name="check" size={20} color="#757575" />
          <Text style={styles.footerButtonText}>{item.status}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          paddingTop:
            Platform.OS === "android" ? StatusBar.currentHeight : insets.top,
        },
      ]}
    >
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "pending" && styles.activeTab]}
          onPress={() => setActiveTab("pending")}
        >
          <Text
            style={
              activeTab === "pending" ? styles.activeTabText : styles.tabText
            }
          >
            Pending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "completed" && styles.activeTab]}
          onPress={() => setActiveTab("completed")}
        >
          <Text
            style={
              activeTab === "completed" ? styles.activeTabText : styles.tabText
            }
          >
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={requests.filter(
          (r) => (r.status === "completed") === (activeTab === "completed")
        )}
        renderItem={renderRequest}
        keyExtractor={(item) => item.request_id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/(tenant_tabs)/requests/contact")}
        >
          <Text style={styles.addButtonText}>Add maintenance request</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    backgroundColor: "#fff",
  },
  tab: {
    flex: 1,
    padding: 15,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#2196F3",
  },
  tabText: {
    color: "#757575",
  },
  activeTabText: {
    color: "#2196F3",
    fontWeight: "500",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 16,
  },
  buttonContainer: {
    paddingBottom: 16,
    backgroundColor: "#fff",
  },
  requestItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    backgroundColor: "#fff",
  },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  priorityText: {
    fontWeight: "500",
  },
  dateText: {
    color: "#757575",
    fontSize: 12,
  },
  description: {
    fontSize: 14,
    color: "#212121",
  },
  requestDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 8,
  },
  requestInfo: {
    fontSize: 12,
    color: "#757575",
  },
  requestFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 8,
  },
  footerButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
  },
  footerButtonText: {
    marginLeft: 4,
    color: "#757575",
    fontSize: 14,
  },
  addButton: {
    backgroundColor: "#2196F3",
    padding: 16,
    margin: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});
