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

export default function Requests() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState("pending");
  const [sortBy, setSortBy] = useState("time");
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [propertyMenuVisible, setPropertyMenuVisible] = useState(false);
  const [statusInfoVisible, setStatusInfoVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const insets = useSafeAreaInsets();
  const [requests, setRequests] = useState([]);
  const {
    state: { userId },
  } = useContext(AuthContext);
  const tabBarHeight = useBottomTabBarHeight();

  const getRequests = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc("get_landlord_requests", {
        p_landlord_id: userId,
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

  const getProperties = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc("get_landlord_houses", {
        p_landlord_id: userId,
      });
      if (data) {
        setProperties(data);
        console.log(data);
        return;
      }
      console.error(error);
    } catch (error) {
      console.error("Error fetching properties:", error);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      getRequests();
      getProperties();
    }, [getRequests, getProperties])
  );

  const getPriorityText = (priority) => {
    switch (priority) {
      case 0:
        return { text: "Minor", color: "#4CAF50" };
      case 1:
        return { text: "Routine", color: "#FFC107" };
      case 2:
        return { text: "Urgent", color: "#F44336" };
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
    return requestsToFilter.filter((r) => {
      const matchesSearch = r.description.toLowerCase().includes(query);
      const matchesProperty = selectedProperty
        ? r.house_id === selectedProperty.house_id
        : true;
      return matchesSearch && matchesProperty;
    });
  };

  const setStatus = async (request_id, status) => {
    try {
      const { data, error } = await supabase.rpc("update_request_status", {
        p_request_id: request_id,
        p_new_status: status,
      });
      if (error) throw error;
      getRequests();
    } catch (error) {
      console.error("Error updating status:", error);
      return { error: error.message };
    }
  };

  const statusWorkflow = [
    {
      status: "sent",
      label: "Request Sent",
      description: "Tenant has submitted a new maintenance request",
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

  const getNextStatus = (currentStatus) => {
    const currentIndex = getStatusIndex(currentStatus);
    return currentIndex < statusWorkflow.length - 1
      ? statusWorkflow[currentIndex + 1].status
      : null;
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
        <Text style={styles.requestInfo}>{item.street_address}</Text>
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
          <MaterialIcons name="comment" size={20} color="#757575" />
          <Text style={styles.footerButtonText}>View discussion</Text>
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
            color="#757575"
          />
          <Text style={styles.footerButtonText}>{item.status}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.surface,
    },
    tabBar: {
      flex: 1,
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
      backgroundColor: theme.colors.surface,
    },
    tab: {
      flex: 1,
      padding: theme.spacing.md,
      alignItems: "center",
    },
    activeTab: {
      borderBottomWidth: 2,
      borderBottomColor: theme.colors.primary,
    },
    tabText: {
      color: theme.colors.placeholder,
    },
    activeTabText: {
      color: theme.colors.primary,
      fontWeight: "500",
    },
    sortButton: {
      padding: theme.spacing.sm,
      marginRight: theme.spacing.sm,
    },
    list: {
      flex: 1,
    },
    listContent: {
      paddingBottom: theme.spacing.md,
    },
    buttonContainer: {
      paddingBottom: theme.spacing.md,
      backgroundColor: theme.colors.surface,
    },
    requestItem: {
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
      backgroundColor: theme.colors.surface,
    },
    requestHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: theme.spacing.sm,
    },
    priorityText: {
      fontWeight: "500",
    },
    dateText: {
      color: theme.colors.placeholder,
      fontSize: theme.typography.fontSize.xs,
    },
    description: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.onSurface,
    },
    requestDetails: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    requestInfo: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.placeholder,
    },
    requestFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: theme.spacing.sm,
      paddingTop: theme.spacing.sm,
    },
    footerButton: {
      flexDirection: "row",
      alignItems: "center",
      padding: theme.spacing.xs,
    },
    footerIconButton: {
      padding: theme.spacing.xs,
    },
    footerButtonText: {
      marginLeft: theme.spacing.xs,
      color: theme.colors.placeholder,
      fontSize: theme.typography.fontSize.sm,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.colors.backdrop,
      justifyContent: "center",
      alignItems: "center",
    },
    sortMenu: {
      position: "absolute",
      right: theme.spacing.sm,
      top: Platform.OS === "android" ? StatusBar.currentHeight + 56 : 56,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      ...theme.elevation.md,
    },
    sortMenuItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: theme.spacing.md,
    },
    sortMenuText: {
      marginLeft: theme.spacing.sm,
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.onSurface,
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      margin: theme.spacing.md,
      marginTop: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
      padding: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      ...theme.elevation.sm,
    },
    searchInput: {
      flex: 1,
      marginLeft: theme.spacing.sm,
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.onSurface,
    },
    statusInfoContainer: {
      backgroundColor: theme.colors.surface,
      margin: theme.spacing.md,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      width: "90%",
      maxWidth: 400,
      ...theme.elevation.md,
    },
    statusInfoTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: "500",
      marginBottom: theme.spacing.md,
      color: theme.colors.onSurface,
    },
    statusInfoItem: {
      marginBottom: theme.spacing.md,
      padding: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.surface,
      ...theme.elevation.sm,
    },
    statusInfoItemActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primaryVariant,
      borderWidth: 1,
    },
    statusInfoItemNext: {
      backgroundColor: theme.colors.secondary,
      borderColor: theme.colors.secondaryVariant,
      borderWidth: 1,
    },
    statusInfoHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: theme.spacing.sm,
    },
    statusInfoLabel: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: "500",
      color: theme.colors.onSurface,
    },
    statusInfoDescription: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.placeholder,
    },
  });

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

      <View style={styles.filterContainer}>
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color="#757575" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search requests..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity
          style={styles.propertyButton}
          onPress={() => setPropertyMenuVisible(true)}
        >
          <MaterialIcons name="home" size={20} color="#757575" />
          <Text style={styles.propertyButtonText}>
            {selectedProperty
              ? selectedProperty.street_address
              : "All Properties"}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={propertyMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPropertyMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPropertyMenuVisible(false)}
        >
          <View style={[styles.sortMenu, styles.propertyMenu]}>
            <TouchableOpacity
              style={styles.sortMenuItem}
              onPress={() => {
                setSelectedProperty(null);
                setPropertyMenuVisible(false);
              }}
            >
              <Text style={styles.sortMenuText}>All Properties</Text>
            </TouchableOpacity>
            {properties.map((property) => (
              <TouchableOpacity
                key={property.house_id}
                style={styles.sortMenuItem}
                onPress={() => {
                  setSelectedProperty(property);
                  setPropertyMenuVisible(false);
                }}
              >
                <Text style={styles.sortMenuText}>
                  {property.street_address}
                </Text>
              </TouchableOpacity>
            ))}
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
              const isNext = currentStatusIndex + 1 === index;
              const isClickable = isNext && status.status !== "completed";
              const shouldHighlight = isNext && status.status !== "completed";

              return (
                <TouchableOpacity
                  key={status.status}
                  style={[
                    styles.statusInfoItem,
                    selectedStatus === status.status &&
                      styles.statusInfoItemActive,
                    shouldHighlight && styles.statusInfoItemNext,
                  ]}
                  onPress={() => {
                    if (isClickable) {
                      setStatus(
                        requests.find((r) => r.status === selectedStatus)
                          .request_id,
                        status.status
                      );
                      setStatusInfoVisible(false);
                    }
                  }}
                  disabled={!isClickable}
                >
                  <View style={styles.statusInfoHeader}>
                    <Text style={styles.statusInfoLabel}>{status.label}</Text>
                    {index < statusWorkflow.length - 1 &&
                    index < currentStatusIndex ? (
                      <MaterialIcons
                        name="arrow-downward"
                        size={20}
                        color="#757575"
                      />
                    ) : null}
                  </View>
                  <Text style={styles.statusInfoDescription}>
                    {status.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

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
    </SafeAreaView>
  );
}
