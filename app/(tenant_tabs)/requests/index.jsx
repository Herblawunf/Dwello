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
        return { text: "Minor", color: theme.colors.success };
      case 1:
        return { text: "Routine", color: theme.colors.warning };
      case 2:
        return { text: "Urgent", color: theme.colors.error };
      default:
        return { text: "Unknown Priority", color: theme.colors.placeholder };
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
        return "send";
      case "seen":
        return "visibility";
      case "contractor sent":
        return "engineering";
      case "completed":
        return "check-circle";
      default:
        return "info";
    }
  };

  const renderRequest = ({ item }) => (
    <ThemedView style={styles.requestItem}>
      <ThemedView style={styles.requestHeader}>
        <ThemedText
          style={[
            styles.priorityText,
            { color: getPriorityText(item.priority).color },
          ]}
        >
          {getPriorityText(item.priority).text}
        </ThemedText>
        <ThemedText style={styles.dateText}>
          {new Date(item.created_at).toLocaleDateString()}
        </ThemedText>
      </ThemedView>
      <ThemedText style={styles.description}>{item.description}</ThemedText>
      <ThemedView style={styles.requestDetails}>
        <ThemedText style={styles.requestInfo}>
          By: {item.poster_first_name} {item.poster_last_name}
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.requestFooter}>
        <TouchableOpacity
          style={styles.footerButton}
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
          <MaterialIcons name="comment" size={20} color={theme.colors.placeholder} />
          <ThemedText style={styles.footerButtonText}>View discussion</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => {
            setSelectedStatus(item.status);
            setStatusInfoVisible(true);
          }}
        >
          <MaterialIcons
            name={getStatusIcon(item.status)}
            size={20}
            color={theme.colors.placeholder}
          />
          <ThemedText style={styles.footerButtonText}>{item.status}</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );

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
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
    filterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    filterSquare: {
      width: 100,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      marginRight: 8,
      ...theme.elevation.sm,
    },
    activeFilterSquare: {
      backgroundColor: theme.colors.primary,
    },
    filterSquareText: {
      fontSize: 16,
      color: theme.colors.onSurface,
      fontFamily: theme.typography.fontFamily.medium,
    },
    activeFilterSquareText: {
      color: theme.colors.onPrimary,
    },
    sortButton: {
      padding: 8,
    },
    requestItem: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 16,
      marginVertical: 8,
      ...theme.elevation.sm,
    },
    requestHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    priorityText: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.medium,
    },
    dateText: {
      fontSize: 14,
      color: theme.colors.placeholder,
      fontFamily: theme.typography.fontFamily.regular,
    },
    description: {
      fontSize: 16,
      color: theme.colors.onSurface,
      fontFamily: theme.typography.fontFamily.regular,
      marginBottom: 12,
    },
    requestDetails: {
      marginBottom: 12,
    },
    requestInfo: {
      fontSize: 14,
      color: theme.colors.placeholder,
      fontFamily: theme.typography.fontFamily.regular,
    },
    requestFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      borderTopWidth: 1,
      borderTopColor: theme.colors.outline,
      paddingTop: 12,
    },
    footerButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    footerButtonText: {
      fontSize: 14,
      color: theme.colors.placeholder,
      fontFamily: theme.typography.fontFamily.regular,
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
    searchContainer: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    searchInput: {
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 8,
      fontSize: 16,
      color: theme.colors.onSurface,
      fontFamily: theme.typography.fontFamily.regular,
      ...theme.elevation.sm,
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
    statusText: {
      flex: 1,
    },
    statusLabel: {
      fontSize: 16,
      color: theme.colors.onSurface,
      fontFamily: theme.typography.fontFamily.medium,
      marginBottom: 4,
    },
    statusDescription: {
      fontSize: 14,
      color: theme.colors.placeholder,
      fontFamily: theme.typography.fontFamily.regular,
    },
    activeStatus: {
      backgroundColor: theme.colors.primary,
    },
    activeStatusText: {
      color: theme.colors.onPrimary,
    },
    addButton: {
      position: 'absolute',
      bottom: 5,
      left: '50%',
      transform: [{ translateX: -100 }],
      backgroundColor: theme.colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      elevation: 4,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      width: 200,
    },
    addButtonText: {
      fontSize: 16,
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
      <ThemedView style={styles.header}>
        <ThemedView style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterSquare, activeTab === "pending" && styles.activeFilterSquare]}
            onPress={() => setActiveTab("pending")}
          >
            <ThemedText style={[styles.filterSquareText, activeTab === "pending" && styles.activeFilterSquareText]}>Pending</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterSquare, activeTab === "completed" && styles.activeFilterSquare]}
            onPress={() => setActiveTab("completed")}
          >
            <ThemedText style={[styles.filterSquareText, activeTab === "completed" && styles.activeFilterSquareText]}>Completed</ThemedText>
          </TouchableOpacity>
        </ThemedView>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setSortMenuVisible(true)}
        >
          <MaterialIcons name="sort" size={24} color={theme.colors.placeholder} />
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search requests..."
          placeholderTextColor={theme.colors.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </ThemedView>

      <PanGestureHandler onHandlerStateChange={onGestureEvent}>
        <ThemedView style={{ flex: 1 }}>
          <FlatList
            data={sortRequests(filterRequests(requests.filter(
              (r) => (r.status === "completed") === (activeTab === "completed")
            )))}
            renderItem={renderRequest}
            keyExtractor={(item) => item.request_id}
            contentContainerStyle={{ paddingBottom: 0 }}
          />
        </ThemedView>
      </PanGestureHandler>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push("/(tenant_tabs)/requests/contact")}
      >
        <ThemedText style={styles.addButtonText}>Add maintenance request</ThemedText>
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
          <ThemedView style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Sort by</ThemedText>
            <TouchableOpacity
              style={[
                styles.sortOption,
                sortBy === "time" && styles.selectedSortOption,
              ]}
              onPress={() => {
                setSortBy("time");
                setSortMenuVisible(false);
              }}
            >
              <ThemedText
                style={[
                  styles.sortOptionText,
                  sortBy === "time" && styles.selectedSortOptionText,
                ]}
              >
                Time
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sortOption,
                sortBy === "priority" && styles.selectedSortOption,
              ]}
              onPress={() => {
                setSortBy("priority");
                setSortMenuVisible(false);
              }}
            >
              <ThemedText
                style={[
                  styles.sortOptionText,
                  sortBy === "priority" && styles.selectedSortOptionText,
                ]}
              >
                Priority
              </ThemedText>
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
          <ThemedView style={styles.statusInfoContainer}>
            <ThemedText style={styles.modalTitle}>Request Status</ThemedText>
            {statusWorkflow.map((step, index) => {
              const isActive = getStatusIndex(selectedStatus) >= index;
              return (
                <ThemedView
                  key={step.status}
                  style={[
                    styles.statusStep,
                    isActive && styles.activeStatus,
                  ]}
                >
                  <ThemedView
                    style={[
                      styles.statusIcon,
                      isActive && styles.activeStatus,
                    ]}
                  >
                    <MaterialIcons
                      name={getStatusIcon(step.status)}
                      size={20}
                      color={isActive ? theme.colors.onPrimary : theme.colors.primary}
                    />
                  </ThemedView>
                  <ThemedView style={styles.statusText}>
                    <ThemedText
                      style={[
                        styles.statusLabel,
                        isActive && styles.activeStatusText,
                      ]}
                    >
                      {step.label}
                    </ThemedText>
                    <ThemedText style={styles.statusDescription}>
                      {step.description}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
              );
            })}
          </ThemedView>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
