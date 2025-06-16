import { useState, useCallback, useContext } from "react";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
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
  Image,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Context as AuthContext } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useTheme } from "@/context/ThemeContext";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { PanGestureHandler, State } from 'react-native-gesture-handler';

export default function Requests() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState("pending");
  const [sortBy, setSortBy] = useState("time");
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusInfoVisible, setStatusInfoVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
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
        return { 
          text: "Minor", 
          color: theme.colors.success,
          icon: 'build'
        };
      case 1:
        return { 
          text: "Routine", 
          color: theme.colors.warning,
          icon: 'handyman'
        };
      case 2:
        return { 
          text: "Urgent", 
          color: theme.colors.error,
          icon: 'priority-high'
        };
      default:
        return { 
          text: "Unknown Priority", 
          color: theme.colors.placeholder,
          icon: 'help'
        };
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
      if (error) throw error;
      getHouseRequests();
    } catch (error) {
      console.error("Error updating status:", error);
      return { error: error.message };
    }
  };

  const statusWorkflow = [
    {
      status: "sent",
      label: "Request Sent",
      description: "Request has been submitted to landlord",
    },
    {
      status: "seen",
      label: "Request Seen",
      description: "Landlord has acknowledged the request",
    },
    {
      status: "contractor sent",
      label: "Sent to Contractor",
      description: "Request has been forwarded to a contractor",
    },
    {
      status: "completed",
      label: "Completed",
      description: "The maintenance request has been resolved",
    },
  ];

  const getStatusIndex = (status) => {
    return statusWorkflow.findIndex((item) => item.status === status);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "sent":
        return { name: "send", color: theme.colors.success };
      case "seen":
        return { name: "visibility", color: theme.colors.primary };
      case "contractor sent":
        return { name: "engineering", color: theme.colors.warning };
      case "completed":
        return { name: "check-circle", color: theme.colors.info };
      default:
        return { name: "info", color: theme.colors.placeholder };
    }
  };

  const renderRequest = ({ item }) => {
    const priorityInfo = getPriorityText(item.priority);
    const statusInfo = getStatusIcon(item.status);
    const formattedDate = new Date(item.created_at).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    return (
      <View style={styles.requestCard}>
        <View style={styles.requestCardContent}>
          <View 
            style={[
              styles.coloredSidebar, 
              { backgroundColor: priorityInfo.color }
            ]}
          />
          
          <TouchableOpacity
            style={styles.requestCardInner}
            activeOpacity={0.9}
            onPress={() =>
              router.push({
                pathname: "/request_screens/",
                params: {
                  requestId: item.request_id,
                  description: item.description,
                  tenant: `${item.poster_first_name} ${item.poster_last_name}`,
                },
              })
            }
          >
            <View style={styles.userInfoHeader}>
              <View style={styles.userIconContainer}>
                <Text style={styles.userInitials}>
                  {item.poster_first_name.charAt(0) + item.poster_last_name.charAt(0)}
                </Text>
              </View>
              <View style={styles.userTextContainer}>
                <Text style={styles.userName}>
                  {item.poster_first_name} {item.poster_last_name}
                </Text>
                <View style={styles.userAddressContainer}>
                  <MaterialIcons name="home" size={12} color={theme.colors.placeholder} style={{marginRight: 4}} />
                  <Text style={styles.userAddress} numberOfLines={1}>{item.street_address}</Text>
                </View>
              </View>
              <View style={styles.priorityContainer}>
                <View style={[styles.priorityBadge, { backgroundColor: priorityInfo.color }]}>
                  <MaterialIcons name={priorityInfo.icon} size={12} color="#FFFFFF" />
                </View>
                <Text style={[styles.priorityText, { color: priorityInfo.color }]}>
                  {priorityInfo.text}
                </Text>
              </View>
            </View>
            
            <Text style={styles.descriptionText} numberOfLines={2}>{item.description}</Text>
            
            <View style={styles.engagementBar}>
              <View
                style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}
              >
                <MaterialIcons
                  name={statusInfo.name}
                  size={12}
                  color="#FFFFFF"
                />
                <Text style={styles.statusText}>
                  {item.status}
                </Text>
              </View>
              
              <View style={styles.dateContainer}>
                <MaterialIcons name="event" size={12} color={theme.colors.placeholder} style={styles.dateIcon} />
                <Text style={styles.dateText}>{formattedDate}</Text>
              </View>
              
              <TouchableOpacity
                style={styles.viewButton}
                onPress={() =>
                  router.push({
                    pathname: "/request_screens/",
                    params: {
                      requestId: item.request_id,
                      description: item.description,
                      tenant: `${item.poster_first_name} ${item.poster_last_name}`,
                    },
                  })
                }
              >
                <Text style={styles.viewButtonText}>View</Text>
                <MaterialIcons name="chevron-right" size={14} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Swipe handler
  const onGestureEvent = (event) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;
      if (translationX < -50 && activeTab === 'pending') {
        setActiveTab('completed');
      } else if (translationX > 50 && activeTab === 'completed') {
        setActiveTab('pending');
      }
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          paddingTop:
            Platform.OS === "android" ? StatusBar.currentHeight : insets.top,
          paddingBottom: 0,
        },
      ]}
      edges={['top']}
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
          <MaterialIcons name="sort" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color="#757575" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search requests..."
            placeholderTextColor={theme.colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <PanGestureHandler onHandlerStateChange={onGestureEvent}>
        <View style={{ flex: 1 }}>
          <FlatList
            data={sortRequests(filterRequests(requests.filter(
              (r) => (r.status === "completed") === (activeTab === "completed")
            )))}
            renderItem={renderRequest}
            keyExtractor={(item) => item.request_id}
            contentContainerStyle={[
              styles.listContent,
              !requests.length && styles.emptyListContent
            ]}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <MaterialIcons name="inbox" size={64} color={theme.colors.placeholder} />
                <Text style={styles.emptyStateTitle}>No requests found</Text>
                <Text style={styles.emptyStateText}>
                  {activeTab === "pending"
                    ? "There are no pending maintenance requests."
                    : "There are no completed maintenance requests."}
                </Text>
              </View>
            )}
          />
        </View>
      </PanGestureHandler>

      <TouchableOpacity
        style={styles.createButton}
        onPress={() => router.push("/(tenant_tabs)/requests/contact")}
      >
        <MaterialIcons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>

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

      <Modal
        visible={statusInfoVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setStatusInfoVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setStatusInfoVisible(false)}
        >
          <View style={styles.statusInfoContainer}>
            <Text style={styles.statusInfoTitle}>Request Status Workflow</Text>
            {statusWorkflow.map((status, index) => {
              const currentStatusIndex = getStatusIndex(selectedStatus);
              const isActive = currentStatusIndex >= index;
              const statusIcon = getStatusIcon(status.status);

              return (
                <View
                  key={status.status}
                  style={[
                    styles.statusInfoItem,
                    selectedStatus === status.status &&
                      styles.statusInfoItemActive,
                  ]}
                >
                  <View style={styles.statusInfoHeader}>
                    <Text style={styles.statusInfoLabel}>{status.label}</Text>
                    {index < statusWorkflow.length - 1 &&
                    index < currentStatusIndex ? (
                      <MaterialIcons
                        name={statusIcon.name}
                        size={20}
                        color="#757575"
                      />
                    ) : null}
                  </View>
                  <Text style={styles.statusInfoDescription}>
                    {status.description}
                  </Text>
                </View>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa", // Light modern background
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.12)",
    elevation: 0,
  },
  tabBar: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
  },
  tab: {
    flex: 1,
    padding: 8,
    alignItems: "center",
    borderRadius: 12,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: "#6200EE", // Tenant primary color
  },
  tabText: {
    color: "rgba(0, 0, 0, 0.54)",
    fontWeight: '500',
    fontSize: 14,
  },
  activeTabText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  sortButton: {
    padding: 8,
    marginRight: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.12)",
  },
  listContent: {
    padding: 12,
    paddingBottom: 24,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  requestCard: {
    marginBottom: 14,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: "#FFFFFF",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  requestCardContent: {
    flexDirection: 'row',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: "#FFFFFF",
  },
  coloredSidebar: {
    width: 8,
    height: '100%',
  },
  requestCardInner: {
    flex: 1,
    padding: 14,
  },
  userInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  userIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#6200EE15", // Tenant primary color with opacity
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  userInitials: {
    fontSize: 13,
    color: "#6200EE", // Tenant primary color
    fontWeight: '600',
  },
  userTextContainer: {
    flex: 1,
    flexDirection: "column",
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
  },
  userAddressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  userAddress: {
    fontSize: 12,
    color: "rgba(0, 0, 0, 0.54)",
    fontWeight: '500',
  },
  priorityContainer: {
    alignItems: 'center',
  },
  priorityBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  priorityText: {
    fontWeight: "600",
    fontSize: 11,
  },
  descriptionText: {
    fontSize: 14,
    color: "#000000",
    fontWeight: '400',
    marginVertical: 10,
    lineHeight: 20,
  },
  engagementBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateIcon: {
    marginRight: 4,
  },
  dateText: {
    color: "rgba(0, 0, 0, 0.54)",
    fontSize: 12,
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6200EE10", // Tenant primary color with opacity
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#6200EE20", // Tenant primary color with opacity
  },
  viewButtonText: {
    fontSize: 12,
    color: "#6200EE", // Tenant primary color
    fontWeight: '600',
    marginRight: 3,
  },
  filterContainer: {
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.12)",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#000000",
    fontWeight: '400',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  sortMenu: {
    position: "absolute",
    right: 8,
    top: Platform.OS === "android" ? StatusBar.currentHeight + 56 : 56,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: 'hidden',
    minWidth: 180,
    elevation: 0,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.12)",
  },
  sortMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  sortMenuText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#000000",
  },
  createButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#6200EE", // Tenant primary color
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  statusInfoContainer: {
    backgroundColor: "#FFFFFF",
    margin: 16,
    padding: 24,
    borderRadius: 16,
    width: "90%",
    maxWidth: 400,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.12)",
  },
  statusInfoTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#000000",
    textAlign: 'center',
  },
  statusInfoItem: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.12)",
  },
  statusInfoItemActive: {
    backgroundColor: "#6200EE15", // Tenant primary color with opacity
    borderLeftWidth: 4,
    borderLeftColor: "#6200EE", // Tenant primary color
  },
  statusInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  statusInfoLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  statusInfoDescription: {
    fontSize: 14,
    color: "rgba(0, 0, 0, 0.54)",
    lineHeight: 20,
  },
  emptyState: {
    alignItems: "center",
    padding: 24,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 16,
    color: "#000000",
  },
  emptyStateText: {
    fontSize: 16,
    color: "rgba(0, 0, 0, 0.54)",
    textAlign: "center",
  },
});
