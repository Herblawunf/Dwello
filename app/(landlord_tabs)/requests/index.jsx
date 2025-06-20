import React, { Component, createRef } from "react";
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
  Animated,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { Context as AuthContext } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { colors } from "../../theme/colors";
import { GestureHandlerRootView, Swipeable } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";

// Define a default theme object with more modern colors
const defaultTheme = {
  colors: {
    primary: colors.primary, // Use theme primary color
    primaryVariant: colors.primaryVariant,
    secondary: colors.secondary,
    secondaryVariant: colors.secondaryVariant,
    background: colors.background,
    surface: colors.surface,
    error: colors.error,
    onPrimary: colors.onPrimary,
    onSecondary: colors.onSecondary,
    onBackground: colors.onBackground,
    onSurface: colors.onSurface,
    onError: colors.onError,
    divider: colors.divider,
    disabled: colors.disabled,
    placeholder: colors.placeholder,
    backdrop: colors.backdrop,
    success: colors.success,
    warning: colors.warning,
    info: colors.info,
    priorityLow: colors.priorityLow,
    priorityMedium: colors.priorityMedium,
    priorityHigh: colors.priorityHigh,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    round: 9999,
  },
  typography: {
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
    },
  },
};

export default class Requests extends Component {
  static contextType = AuthContext;

  constructor(props) {
    super(props);

    this.state = {
      activeTab: "pending",
      sortBy: "time",
      sortMenuVisible: false,
      searchQuery: "",
      properties: [],
      selectedProperty: null,
      propertyMenuVisible: false,
      statusInfoVisible: false,
      selectedStatus: null,
      selectedRequestId: null,
      requests: [],
      tabBarHeight: 49, // Default value
    };

    this.theme = defaultTheme;
  }

  componentDidMount() {
    this.getRequests();
    this.getProperties();
  }

  componentDidUpdate(prevProps) {
    if (this.props !== prevProps) {
      this.getRequests();
      this.getProperties();
    }
  }

  getRequests = async () => {
    try {
      const { userId } = this.context.state;
      const { data, error } = await supabase.rpc("get_landlord_requests", {
        p_landlord_id: userId,
      });
      if (data) {
        this.setState({ requests: data });
        return;
      }
      console.error(error);
    } catch (error) {
      console.error(error);
    }
  };

  getProperties = async () => {
    try {
      const { userId } = this.context.state;
      const { data, error } = await supabase.rpc("get_landlord_houses", {
        p_landlord_id: userId,
      });
      if (data) {
        this.setState({ properties: data });
        console.log(data);
        return;
      }
      console.error(error);
    } catch (error) {
      console.error("Error fetching properties:", error);
    }
  };

  getPriorityText = (priority) => {
    switch (priority) {
      case 0:
        return {
          text: "Minor",
          color: "#2ecc71", // Modern green
          icon: "build",
        };
      case 1:
        return {
          text: "Routine",
          color: "#f39c12", // Modern orange
          icon: "handyman",
        };
      case 2:
        return {
          text: "Urgent",
          color: "#e74c3c", // Modern red
          icon: "priority-high",
        };
      default:
        return {
          text: "Unknown Priority",
          color: "#95a5a6",
          icon: "help",
        };
    }
  };

  sortRequests = (requestsToSort) => {
    const { sortBy } = this.state;
    if (sortBy === "time") {
      return [...requestsToSort].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
    } else if (sortBy === "priority") {
      return [...requestsToSort].sort((a, b) => b.priority - a.priority);
    }
    return requestsToSort;
  };

  filterRequests = (requestsToFilter) => {
    const { searchQuery, selectedProperty } = this.state;
    const query = searchQuery.toLowerCase();
    return requestsToFilter.filter((r) => {
      const matchesSearch = r.description.toLowerCase().includes(query);
      const matchesProperty = selectedProperty
        ? r.house_id === selectedProperty.house_id
        : true;
      return matchesSearch && matchesProperty;
    });
  };

  setStatus = async (request_id, status) => {
    try {
      console.log('Setting status:', status, 'for request:', request_id);
      const { data, error } = await supabase.rpc("update_request_status", {
        p_request_id: request_id,
        p_new_status: status,
      });
      if (error) throw error;
      console.log('Status update successful');
      this.getRequests();
    } catch (error) {
      console.error("Error updating status:", error);
      return { error: error.message };
    }
  };

  statusWorkflow = [
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

  getStatusIndex = (status) => {
    return this.statusWorkflow.findIndex((item) => item.status === status);
  };

  getNextStatus = (currentStatus) => {
    const currentIndex = this.getStatusIndex(currentStatus);
    return currentIndex < this.statusWorkflow.length - 1
      ? this.statusWorkflow[currentIndex + 1].status
      : null;
  };

  getStatusIcon = (status) => {
    switch (status) {
      case "sent":
        return { name: "send", color: this.theme.colors.success }; // Success color
      case "seen":
        return { name: "visibility", color: this.theme.colors.primary }; // Primary color
      case "contractor sent":
        return { name: "engineering", color: this.theme.colors.warning }; // Warning color
      case "completed":
        return { name: "check-circle", color: this.theme.colors.success }; // Success color
      default:
        return { name: "info", color: this.theme.colors.placeholder }; // Placeholder color
    }
  };

  renderRequest = ({ item, index }) => {
    const priorityInfo = this.getPriorityText(item.priority);
    const statusInfo = this.getStatusIcon(item.status);
    const formattedDate = new Date(item.created_at).toLocaleDateString(
      undefined,
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );

    const handlePress = () => {
      router.push(`/(landlord_tabs)/chat/${item.request_id}`);
    };

    const handleSwipeRight = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      this.setState({
        selectedStatus: item.status,
        selectedRequestId: item.request_id,
        statusInfoVisible: true
      });
    };

    const renderRightActions = (progress, dragX) => {
      const scale = dragX.interpolate({
        inputRange: [-100, 0],
        outputRange: [1, 0],
        extrapolate: 'clamp',
      });

      return (
        <View style={styles.swipeActionContainer}>
          <Animated.View style={[styles.swipeAction, { transform: [{ scale }] }]}>
            <MaterialIcons name="info" size={24} color="#FFFFFF" />
          </Animated.View>
        </View>
      );
    };

    return (
      <Swipeable
        renderRightActions={renderRightActions}
        onSwipeableOpen={handleSwipeRight}
        friction={2}
        rightThreshold={40}
        enabled={item.status !== "completed"}
      >
        <View style={styles.requestCard}>
          <View style={styles.requestCardContent}>
            <View
              style={[
                styles.coloredSidebar,
                { backgroundColor: priorityInfo.color },
              ]}
            />

            <TouchableOpacity
              style={styles.requestCardInner}
              activeOpacity={0.9}
              onPress={handlePress}
            >
              <View style={styles.userInfoHeader}>
                <View style={styles.userIconContainer}>
                  <Text style={styles.userInitials}>
                    {item.poster_first_name.charAt(0) +
                      item.poster_last_name.charAt(0)}
                  </Text>
                </View>
                <View style={styles.userTextContainer}>
                  <Text style={styles.userName}>
                    {item.poster_first_name} {item.poster_last_name}
                  </Text>
                  <View style={styles.userAddressContainer}>
                    <MaterialIcons
                      name="home"
                      size={12}
                      color={this.theme.colors.placeholder}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.userAddress} numberOfLines={1}>
                      {item.street_address}
                    </Text>
                  </View>
                </View>
                <View style={styles.priorityContainer}>
                  <View
                    style={[
                      styles.priorityBadge,
                      { backgroundColor: priorityInfo.color },
                    ]}
                  >
                    <MaterialIcons
                      name={priorityInfo.icon}
                      size={12}
                      color="#FFFFFF"
                    />
                  </View>
                  <Text
                    style={[styles.priorityText, { color: priorityInfo.color }]}
                  >
                    {priorityInfo.text}
                  </Text>
                </View>
              </View>

              <Text style={styles.descriptionText} numberOfLines={2}>
                {item.description}
              </Text>

              <View style={styles.engagementBar}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: statusInfo.color },
                  ]}
                >
                  <MaterialIcons
                    name={statusInfo.name}
                    size={12}
                    color="#FFFFFF"
                  />
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>

                <View style={styles.dateContainer}>
                  <MaterialIcons
                    name="event"
                    size={12}
                    color={this.theme.colors.placeholder}
                    style={styles.dateIcon}
                  />
                  <Text style={styles.dateText}>{formattedDate}</Text>
                </View>

                <TouchableOpacity style={styles.viewButton} onPress={handlePress}>
                  <Text style={styles.viewButtonText}>View</Text>
                  <MaterialIcons
                    name="chevron-right"
                    size={14}
                    color={this.theme.colors.primary}
                  />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Swipeable>
    );
  };

  render() {
    const {
      activeTab,
      sortMenuVisible,
      searchQuery,
      properties,
      selectedProperty,
      propertyMenuVisible,
      statusInfoVisible,
      selectedStatus,
      selectedRequestId,
      requests,
    } = this.state;

    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaInsetsContext.Consumer>
          {(insets) => (
            <SafeAreaView
              style={[
                styles.container,
                {
                  paddingTop:
                    Platform.OS === "android"
                      ? StatusBar.currentHeight
                      : insets.top,
                },
              ]}
            >
              <View style={styles.header}>
                <View style={styles.tabBar}>
                  <TouchableOpacity
                    style={[
                      styles.tab,
                      activeTab === "pending" && styles.activeTab,
                    ]}
                    onPress={() => this.setState({ activeTab: "pending" })}
                  >
                    <Text
                      style={
                        activeTab === "pending"
                          ? styles.activeTabText
                          : styles.tabText
                      }
                    >
                      Pending
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.tab,
                      activeTab === "completed" && styles.activeTab,
                    ]}
                    onPress={() => this.setState({ activeTab: "completed" })}
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
                  onPress={() => this.setState({ sortMenuVisible: true })}
                >
                  <MaterialIcons
                    name="sort"
                    size={24}
                    color={defaultTheme.colors.primary}
                  />
                </TouchableOpacity>
              </View>

              <Modal
                visible={sortMenuVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => this.setState({ sortMenuVisible: false })}
              >
                <TouchableOpacity
                  style={styles.modalOverlay}
                  activeOpacity={1}
                  onPress={() => this.setState({ sortMenuVisible: false })}
                >
                  <View style={styles.sortMenu}>
                    <TouchableOpacity
                      style={styles.sortMenuItem}
                      onPress={() => {
                        this.setState({
                          sortBy: "time",
                          sortMenuVisible: false,
                        });
                      }}
                    >
                      <MaterialIcons name="schedule" size={20} color="#757575" />
                      <Text style={styles.sortMenuText}>Sort by Time</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.sortMenuItem}
                      onPress={() => {
                        this.setState({
                          sortBy: "priority",
                          sortMenuVisible: false,
                        });
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
                    onChangeText={(text) => this.setState({ searchQuery: text })}
                  />
                </View>

                <TouchableOpacity
                  style={styles.propertyButton}
                  onPress={() => this.setState({ propertyMenuVisible: true })}
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
                onRequestClose={() =>
                  this.setState({ propertyMenuVisible: false })
                }
              >
                <TouchableOpacity
                  style={styles.modalOverlay}
                  activeOpacity={1}
                  onPress={() => this.setState({ propertyMenuVisible: false })}
                >
                  <View style={[styles.sortMenu, styles.propertyMenu]}>
                    <TouchableOpacity
                      style={styles.sortMenuItem}
                      onPress={() => {
                        this.setState({
                          selectedProperty: null,
                          propertyMenuVisible: false,
                        });
                      }}
                    >
                      <Text style={styles.sortMenuText}>All Properties</Text>
                    </TouchableOpacity>
                    {properties.map((property) => (
                      <TouchableOpacity
                        key={property.house_id}
                        style={styles.sortMenuItem}
                        onPress={() => {
                          this.setState({
                            selectedProperty: property,
                            propertyMenuVisible: false,
                          });
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
                onRequestClose={() => this.setState({ statusInfoVisible: false })}
              >
                <TouchableOpacity
                  style={styles.modalOverlay}
                  activeOpacity={1}
                  onPress={() => this.setState({ statusInfoVisible: false })}
                >
                  <View style={styles.statusInfoContainer}>
                    <Text style={styles.statusInfoTitle}>Request Status Workflow</Text>
                    {this.statusWorkflow.map((status, index) => {
                      const currentStatusIndex = this.getStatusIndex(selectedStatus);
                      const isNext = currentStatusIndex + 1 === index;
                      const isClickable = isNext;
                      const shouldHighlight = isNext;

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
                              this.setStatus(selectedRequestId, status.status);
                              this.setState({ statusInfoVisible: false });
                            }
                          }}
                          disabled={!isClickable}
                        >
                          <View style={styles.statusInfoHeader}>
                            <Text style={styles.statusInfoLabel}>{status.label}</Text>
                            {index < this.statusWorkflow.length - 1 &&
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
                data={this.sortRequests(
                  this.filterRequests(
                    requests.filter(
                      (r) =>
                        (r.status === "completed") === (activeTab === "completed")
                    )
                  )
                )}
                renderItem={this.renderRequest}
                keyExtractor={(item) => item.request_id}
                style={styles.list}
                contentContainerStyle={[
                  styles.listContent,
                  !requests.length && styles.emptyListContent,
                ]}
                showsVerticalScrollIndicator={false}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={10}
                removeClippedSubviews={true}
                ListEmptyComponent={() => (
                  <View style={styles.emptyState}>
                    <MaterialIcons
                      name="inbox"
                      size={64}
                      color={this.theme.colors.placeholder}
                    />
                    <Text style={styles.emptyStateTitle}>No requests found</Text>
                    <Text style={styles.emptyStateText}>
                      {activeTab === "pending"
                        ? "There are no pending maintenance requests."
                        : "There are no completed maintenance requests."}
                    </Text>
                  </View>
                )}
              />
            </SafeAreaView>
          )}
        </SafeAreaInsetsContext.Consumer>
      </GestureHandlerRootView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa", // Light modern background
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: defaultTheme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: defaultTheme.colors.divider,
  },
  tabBar: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: defaultTheme.colors.surface,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  tab: {
    flex: 1,
    padding: defaultTheme.spacing.sm,
    alignItems: "center",
    borderRadius: 12,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: defaultTheme.colors.primary,
  },
  tabText: {
    color: defaultTheme.colors.placeholder,
    fontWeight: "500",
    fontSize: 14,
  },
  activeTabText: {
    color: defaultTheme.colors.onPrimary,
    fontWeight: "600",
    fontSize: 14,
  },
  sortButton: {
    padding: defaultTheme.spacing.sm,
    backgroundColor: defaultTheme.colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: defaultTheme.colors.divider,
  },
  list: {
    flex: 1,
    backgroundColor: "#f8f9fa", // Light modern background
  },
  listContent: {
    padding: 12,
    paddingBottom: defaultTheme.spacing.lg,
  },
  requestCard: {
    marginBottom: 14,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: defaultTheme.colors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  requestCardContent: {
    flexDirection: "row",
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: defaultTheme.colors.surface,
  },
  coloredSidebar: {
    width: 8,
    height: "100%",
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
    backgroundColor: defaultTheme.colors.info + "15",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  userInitials: {
    fontSize: 13,
    color: defaultTheme.colors.info,
    fontWeight: "600",
  },
  userTextContainer: {
    flex: 1,
    flexDirection: "column",
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: defaultTheme.colors.onSurface,
  },
  userAddressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  userAddress: {
    fontSize: 12,
    color: defaultTheme.colors.placeholder,
    fontWeight: "500",
  },
  priorityContainer: {
    alignItems: "center",
  },
  priorityBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  priorityText: {
    fontWeight: "600",
    fontSize: 11,
  },
  descriptionText: {
    fontSize: 14,
    color: defaultTheme.colors.onSurface,
    fontWeight: "400",
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
    borderTopColor: "rgba(0,0,0,0.04)",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateIcon: {
    marginRight: 4,
  },
  dateText: {
    color: defaultTheme.colors.placeholder,
    fontSize: 12,
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: defaultTheme.colors.primary + "10",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: defaultTheme.colors.primary + "20",
  },
  viewButtonText: {
    fontSize: 12,
    color: defaultTheme.colors.primary,
    fontWeight: "600",
    marginRight: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: defaultTheme.colors.backdrop,
    justifyContent: "center",
    alignItems: "center",
  },
  sortMenu: {
    position: "absolute",
    right: defaultTheme.spacing.sm,
    top: Platform.OS === "android" ? StatusBar.currentHeight + 56 : 56,
    backgroundColor: defaultTheme.colors.surface,
    borderRadius: defaultTheme.borderRadius.md,
    overflow: "hidden",
    minWidth: 180,
    elevation: 0,
    borderWidth: 1,
    borderColor: defaultTheme.colors.divider,
  },
  sortMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: defaultTheme.spacing.md,
  },
  sortMenuText: {
    marginLeft: defaultTheme.spacing.sm,
    fontSize: defaultTheme.typography.fontSize.md,
    color: defaultTheme.colors.onSurface,
  },
  filterContainer: {
    backgroundColor: defaultTheme.colors.background,
    paddingHorizontal: defaultTheme.spacing.md,
    paddingVertical: defaultTheme.spacing.sm,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: defaultTheme.colors.surface,
    marginBottom: defaultTheme.spacing.sm,
    paddingHorizontal: defaultTheme.spacing.md,
    paddingVertical: defaultTheme.spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: defaultTheme.colors.divider,
  },
  searchInput: {
    flex: 1,
    marginLeft: defaultTheme.spacing.sm,
    fontSize: 14,
    color: defaultTheme.colors.onSurface,
    fontWeight: "400",
  },
  propertyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: defaultTheme.colors.surface,
    padding: defaultTheme.spacing.sm,
    borderRadius: 20,
    marginBottom: defaultTheme.spacing.sm,
    borderWidth: 1,
    borderColor: defaultTheme.colors.divider,
  },
  propertyButtonText: {
    flex: 1,
    marginLeft: defaultTheme.spacing.sm,
    fontSize: 14,
    color: defaultTheme.colors.onSurface,
  },
  propertyMenu: {
    top: Platform.OS === "android" ? StatusBar.currentHeight + 110 : 110,
    maxHeight: 300,
  },
  statusInfoContainer: {
    backgroundColor: defaultTheme.colors.surface,
    margin: defaultTheme.spacing.md,
    padding: defaultTheme.spacing.lg,
    borderRadius: 16,
    width: "90%",
    maxWidth: 400,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: defaultTheme.colors.divider,
  },
  statusInfoTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: defaultTheme.spacing.md,
    color: defaultTheme.colors.onSurface,
    textAlign: "center",
  },
  statusInfoItem: {
    marginBottom: defaultTheme.spacing.md,
    padding: defaultTheme.spacing.md,
    borderRadius: 12,
    backgroundColor: defaultTheme.colors.background,
    borderWidth: 1,
    borderColor: defaultTheme.colors.divider,
  },
  statusInfoItemActive: {
    backgroundColor: defaultTheme.colors.primary + "15",
    borderLeftWidth: 4,
    borderLeftColor: defaultTheme.colors.primary,
  },
  statusInfoItemNext: {
    backgroundColor: defaultTheme.colors.secondary + "15",
    borderLeftWidth: 4,
    borderLeftColor: defaultTheme.colors.secondary,
  },
  statusInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: defaultTheme.spacing.sm,
  },
  statusInfoLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: defaultTheme.colors.onSurface,
  },
  statusInfoDescription: {
    fontSize: 14,
    color: defaultTheme.colors.placeholder,
    lineHeight: 20,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  emptyState: {
    alignItems: "center",
    padding: defaultTheme.spacing.lg,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: defaultTheme.spacing.md,
    color: defaultTheme.colors.onSurface,
  },
  emptyStateText: {
    fontSize: 16,
    color: defaultTheme.colors.placeholder,
    textAlign: "center",
  },
  swipeActionContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: 10,
  },
  swipeAction: {
    backgroundColor: defaultTheme.colors.primary,
    padding: 10,
    borderRadius: 10,
  },
});
