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
  Modal,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Context as AuthContext } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

export default function Requests() {
  const [activeTab, setActiveTab] = useState("pending");
  const [sortBy, setSortBy] = useState("time");
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const insets = useSafeAreaInsets();
  const [requests, setRequests] = useState([]);
  const {
    state: { userId },
  } = useContext(AuthContext);
  const tabBarHeight = useBottomTabBarHeight();

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

  const sortRequests = (requestsToSort) => {
    if (sortBy === "time") {
      return [...requestsToSort].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
    } else if (sortBy === "priority") {
      return [...requestsToSort].sort((a, b) => b.priority - a.priority);
    }
    return requestsToSort;
  };

  const filterRequests = (requestsToFilter) => {
    const query = searchQuery.toLowerCase();
    return requestsToFilter.filter((r) =>
      r.description.toLowerCase().includes(query)
    );
  };

  const setStatus = async (request_id, status) => {
    try {
      const { data, error } = await supabase.rpc("update_request_status", {
        p_request_id: request_id,
        p_new_status: status,
      });
      console.log(status);
      if (error) throw error;
      getHouseRequests();
    } catch (error) {
      console.error("Error updating status:", error);
      return { error: error.message };
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
          <Text style={styles.footerButtonText}>View thread</Text>
        </TouchableOpacity>
        {item.status === "contractor sent" || item.status === "completed" ? (
          <TouchableOpacity
            style={styles.footerButton}
            onPress={() =>
              setStatus(
                item.request_id,
                item.status === "contractor sent"
                  ? "completed"
                  : "contractor sent"
              )
            }
          >
            <MaterialIcons
              name={item.status === "contractor sent" ? "check" : "undo"}
              size={20}
              color="#757575"
            />
            <Text style={styles.footerButtonText}>
              {item.status === "contractor sent"
                ? "Mark completed"
                : "Mark incomplete"}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.footerButton}>
            <MaterialIcons name="info" size={20} color="#757575" />
            <Text style={styles.footerButtonText}>{item.status}</Text>
          </View>
        )}
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
      <View style={styles.header}>
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
                activeTab === "completed"
                  ? styles.activeTabText
                  : styles.tabText
              }
            >
              Completed
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setSortMenuVisible(true)}
        >
          <MaterialIcons name="sort" size={24} color="#757575" />
        </TouchableOpacity>
      </View>

      <Modal
        visible={sortMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSortMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSortMenuVisible(false)}
        >
          <View style={styles.sortMenu}>
            <TouchableOpacity
              style={styles.sortMenuItem}
              onPress={() => {
                setSortBy("time");
                setSortMenuVisible(false);
              }}
            >
              <MaterialIcons name="schedule" size={20} color="#757575" />
              <Text style={styles.sortMenuText}>Sort by Time</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sortMenuItem}
              onPress={() => {
                setSortBy("priority");
                setSortMenuVisible(false);
              }}
            >
              <MaterialIcons name="flag" size={20} color="#757575" />
              <Text style={styles.sortMenuText}>Sort by Priority</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#757575" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search requests..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={sortRequests(
          filterRequests(
            requests.filter(
              (r) => (r.status === "completed") === (activeTab === "completed")
            )
          )
        )}
        renderItem={renderRequest}
        keyExtractor={(item) => item.request_id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.addButton,
            {
              marginBottom: Platform.OS == "android" ? 0 : tabBarHeight,
            },
          ]}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  tabBar: {
    flex: 1,
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
  sortButton: {
    padding: 12,
    marginRight: 8,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-start",
  },
  sortMenu: {
    position: "absolute",
    right: 8,
    top: Platform.OS === "android" ? StatusBar.currentHeight + 56 : 56,
    backgroundColor: "white",
    borderRadius: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  sortMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  sortMenuText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#212121",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    padding: 8,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#212121",
  },
});
