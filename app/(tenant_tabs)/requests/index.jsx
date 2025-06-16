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
    const formattedDate = new Date(item.created_at).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    
    return (
      <ThemedView style={styles.requestItemContainer}>
        <LinearGradient
          colors={priorityInfo.gradient}
          style={styles.requestItemGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={[styles.priorityIconContainer, { backgroundColor: priorityInfo.gradient[0] + '40' }]}>
            <MaterialIcons name={priorityInfo.icon} size={22} color="#FFFFFF" />
          </View>
          
          <View style={styles.requestContent}>
            <View style={styles.requestHeader}>
              <ThemedText style={styles.priorityText}>
                {priorityInfo.text}
              </ThemedText>
              <ThemedText style={styles.dateText}>
                {formattedDate}
              </ThemedText>
            </View>
            
            <ThemedText style={styles.description} numberOfLines={2}>{item.description}</ThemedText>
            
            <View style={styles.requestDetails}>
              <View style={styles.userInfoContainer}>
                <View style={styles.userIconContainer}>
                  <ThemedText style={styles.userInitials}>
                    {item.poster_first_name.charAt(0) + item.poster_last_name.charAt(0)}
                  </ThemedText>
                </View>
                <ThemedText style={styles.requestInfo}>
                  {item.poster_first_name} {item.poster_last_name}
                </ThemedText>
              </View>
            </View>
            
            <View style={styles.requestFooter}>
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
                <MaterialIcons name="comment" size={18} color={theme.colors.primary} />
                <ThemedText style={[styles.footerButtonText, { color: theme.colors.primary }]}>
                  View
                </ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.statusButton}
                onPress={() => {
                  setSelectedStatus(item.status);
                  setStatusInfoVisible(true);
                }}
              >
                <LinearGradient
                  colors={statusInfo.gradient}
                  style={styles.statusBadge}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <MaterialIcons
                    name={statusInfo.name}
                    size={14}
                    color="#000000"
                  />
                  <ThemedText style={[styles.statusText, { color: "#000000" }]}>
                    {item.status}
                  </ThemedText>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </ThemedView>
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingBottom: 0,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
    filterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    filterSquare: {
      width: 100,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      ...theme.elevation.sm,
    },
    activeFilterSquare: {
      backgroundColor: theme.colors.primary,
    },
    filterSquareText: {
      fontSize: 14,
      color: theme.colors.onSurface,
      fontFamily: theme.typography.fontFamily.medium,
    },
    activeFilterSquareText: {
      color: theme.colors.onPrimary,
    },
    sortButton: {
      padding: 8,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      elevation: 0,
    },
    requestItemContainer: {
      marginHorizontal: 12,
      marginVertical: 6,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      elevation: 0,
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
    },
    requestItemGradient: {
      flexDirection: 'row',
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: theme.colors.surface,
    },
    priorityIconContainer: {
      width: 40,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
    },
    requestContent: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      padding: 12,
      borderTopRightRadius: 12,
      borderBottomRightRadius: 12,
    },
    requestHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    priorityText: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.semiBold,
    },
    dateText: {
      fontSize: 12,
      color: theme.colors.placeholder,
      fontFamily: theme.typography.fontFamily.regular,
    },
    description: {
      fontSize: 14,
      color: theme.colors.onSurface,
      fontFamily: theme.typography.fontFamily.regular,
      marginBottom: 10,
      lineHeight: 18,
    },
    requestDetails: {
      marginBottom: 10,
    },
    userInfoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    userIconContainer: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.colors.primaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 6,
    },
    userInitials: {
      fontSize: 12,
      color: theme.colors.primary,
      fontFamily: theme.typography.fontFamily.medium,
    },
    requestInfo: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      fontFamily: theme.typography.fontFamily.medium,
    },
    requestFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: 'center',
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
    },
    footerButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    footerButtonText: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamily.medium,
    },
    statusButton: {
      alignItems: 'flex-end',
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 8,
      gap: 3,
    },
    statusText: {
      fontSize: 10,
      fontFamily: theme.typography.fontFamily.medium,
    },
    searchContainer: {
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    searchInput: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 14,
      color: theme.colors.onSurface,
      fontFamily: theme.typography.fontFamily.regular,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      elevation: 0,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 20,
      width: "80%",
      maxWidth: 400,
      ...theme.elevation.md,
    },
    modalTitle: {
      fontSize: 18,
      color: theme.colors.onSurface,
      fontFamily: theme.typography.fontFamily.medium,
      marginBottom: 16,
      textAlign: "center",
    },
    sortOption: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
    sortOptionText: {
      fontSize: 16,
      color: theme.colors.onSurface,
      fontFamily: theme.typography.fontFamily.regular,
    },
    selectedSortOption: {
      backgroundColor: theme.colors.primaryContainer,
    },
    selectedSortOptionText: {
      color: theme.colors.primary,
      fontFamily: theme.typography.fontFamily.medium,
    },
    statusInfoContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 20,
      width: "80%",
      maxWidth: 400,
      ...theme.elevation.md,
    },
    statusStep: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    statusIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.primaryContainer,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    statusLabel: {
      fontSize: 16,
      color: "#000000",
      fontFamily: theme.typography.fontFamily.medium,
      marginBottom: 4,
    },
    statusDescription: {
      fontSize: 14,
      color: "#000000",
      fontFamily: theme.typography.fontFamily.regular,
    },
    activeStatus: {
      backgroundColor: theme.colors.primary,
    },
    activeStatusText: {
      color: "#000000",
    },
    addButton: {
      position: 'absolute',
      bottom: 16,
      left: '50%',
      transform: [{ translateX: -90 }],
      backgroundColor: theme.colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 20,
      elevation: 2,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      width: 180,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
    },
    addButtonText: {
      fontSize: 14,
      color: theme.colors.onPrimary,
      fontFamily: theme.typography.fontFamily.medium,
      textAlign: 'center',
    },
  });

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
            </ThemedView>
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
