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
import { LinearGradient } from 'expo-linear-gradient';

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
          gradient: ['#4CAF50', '#81C784'],
          icon: 'build'
        };
      case 1:
        return { 
          text: "Routine", 
          color: theme.colors.warning,
          gradient: ['#FFC107', '#FFD54F'],
          icon: 'handyman'
        };
      case 2:
        return { 
          text: "Urgent", 
          color: theme.colors.error,
          gradient: ['#F44336', '#E57373'],
          icon: 'priority-high'
        };
      default:
        return { 
          text: "Unknown Priority", 
          color: theme.colors.placeholder,
          gradient: ['#9E9E9E', '#BDBDBD'],
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
        return { name: "send", color: "#4CAF50", gradient: ['#4CAF50', '#81C784'] };
      case "seen":
        return { name: "visibility", color: "#2196F3", gradient: ['#2196F3', '#64B5F6'] };
      case "contractor sent":
        return { name: "engineering", color: "#FF9800", gradient: ['#FF9800', '#FFB74D'] };
      case "completed":
        return { name: "check-circle", color: "#673AB7", gradient: ['#673AB7', '#9575CD'] };
      default:
        return { name: "info", color: "#9E9E9E", gradient: ['#9E9E9E', '#BDBDBD'] };
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
                    color={statusInfo.color}
                  />
                  <ThemedText style={[styles.statusText, { color: statusInfo.color }]}>
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
          <MaterialIcons name="sort" size={24} color={theme.colors.primary} />
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
            contentContainerStyle={{ paddingBottom: 80 }}
            showsVerticalScrollIndicator={false}
          />
        </ThemedView>
      </PanGestureHandler>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push("/(tenant_tabs)/requests/contact")}
      >
        <Ionicons name="add-circle-outline" size={20} color={theme.colors.onPrimary} />
        <ThemedText style={styles.addButtonText}>Add request</ThemedText>
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
                      name={getStatusIcon(step.status).name}
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
