import { useState, useCallback, useContext } from "react";
import {
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Platform,
  StatusBar,
  View,
  SafeAreaView,
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from "@/lib/supabase";
import { useFocusEffect } from "@react-navigation/native";
import { Context as AuthContext } from "@/context/AuthContext";
import { formatDate } from "@/tools/formatDate";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

const NotificationItem = ({ item, theme }) => {
  const getTypeInfo = () => {
    switch (item.type) {
      case 'rent':
        return {
          color: theme.colors.primary,
          icon: 'home',
          label: 'Rent',
          backgroundColor: theme.colors.primary + '15',
        };
      case 'receive':
        return {
          color: theme.colors.success,
          icon: 'arrow-downward',
          label: 'Receiving',
          backgroundColor: theme.colors.success + '15',
        };
      case 'send':
        return {
          color: theme.colors.error,
          icon: 'arrow-upward',
          label: 'Sending',
          backgroundColor: theme.colors.error + '15',
        };
      default:
        return {
          color: theme.colors.placeholder,
          icon: 'notifications',
          label: 'Notification',
          backgroundColor: theme.colors.placeholder + '15',
        };
    }
  };

  const typeInfo = getTypeInfo();

  const styles = StyleSheet.create({
    notificationItem: {
      marginBottom: 14,
      borderRadius: 14,
      overflow: "hidden",
      backgroundColor: theme.colors.surface,
      shadowColor: theme.colors.onBackground,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,
      shadowRadius: 3,
      elevation: 2,
      borderWidth: 1,
      borderColor: "rgba(0,0,0,0.04)",
    },
    notificationContent: {
      flexDirection: "row",
      borderRadius: 14,
      overflow: "hidden",
      backgroundColor: theme.colors.surface,
    },
    coloredSidebar: {
      width: 8,
      height: "100%",
      backgroundColor: typeInfo.color,
    },
    notificationInner: {
      flex: 1,
      padding: 16,
    },
    notificationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: typeInfo.backgroundColor,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    headerContent: {
      flex: 1,
    },
    notificationTitle: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.onSurface,
      marginBottom: 4,
    },
    notificationSubtitle: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.placeholder,
    },
    notificationMessage: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 12,
      lineHeight: 20,
    },
    notificationFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.divider,
    },
    dateContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    dateIcon: {
      marginRight: 4,
    },
    dateText: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.placeholder,
    },
    amountContainer: {
      backgroundColor: typeInfo.backgroundColor,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    amountText: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.medium,
      color: typeInfo.color,
    },
  });

  return (
    <ThemedView style={styles.notificationItem}>
      <ThemedView style={styles.notificationContent}>
        <ThemedView style={styles.coloredSidebar} />
        <ThemedView style={styles.notificationInner}>
          <ThemedView style={styles.notificationHeader}>
            <ThemedView style={styles.iconContainer}>
              <MaterialIcons
                name={typeInfo.icon}
                size={20}
                color={typeInfo.color}
              />
            </ThemedView>
            <ThemedView style={styles.headerContent}>
              <ThemedText style={styles.notificationTitle}>
                {item.type === "rent"
                  ? "Rent Payment Due"
                  : `${item.payee.name} added ${item.description}`}
              </ThemedText>
              <ThemedText style={styles.notificationSubtitle}>
                {typeInfo.label}
              </ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedText style={styles.notificationMessage}>
            {item.type === "rent"
              ? `Due date: ${formatDate(item.dueDate, (reverse = true))}`
              : `You ${
                  item.type === "receive" ? "will receive" : "owe"
                } £${item.amount.toFixed(2)}`}
          </ThemedText>

          <ThemedView style={styles.notificationFooter}>
            <ThemedView style={styles.dateContainer}>
              <MaterialIcons
                name="access-time"
                size={14}
                color={theme.colors.placeholder}
                style={styles.dateIcon}
              />
              <ThemedText style={styles.dateText}>
                {formatDate(item.date)}
              </ThemedText>
            </ThemedView>
            {item.type === "rent" && (
              <ThemedView style={styles.amountContainer}>
                <ThemedText style={styles.amountText}>
                  £{item.amount.toFixed(2)}
                </ThemedText>
              </ThemedView>
            )}
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
};

const NotificationsScreen = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filterBy, setFilterBy] = useState("all");
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const { state: authState } = useContext(AuthContext);
  const userId = authState.userId;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 4,
      backgroundColor: theme.colors.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
    },
    headerTitle: {
      fontSize: 24,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.onBackground,
    },
    filterButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.divider,
      gap: 8,
    },
    filterButtonText: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.primary,
    },
    list: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: insets.bottom + 20,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.colors.backdrop,
      justifyContent: "flex-start",
    },
    filterMenu: {
      position: "absolute",
      right: 8,
      top: Platform.OS === "android" ? StatusBar.currentHeight + 56 : 56,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      overflow: "hidden",
      minWidth: 200,
      borderWidth: 1,
      borderColor: theme.colors.divider,
      ...Platform.select({
        ios: {
          shadowColor: theme.colors.onBackground,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    filterMenuItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
    },
    filterMenuText: {
      marginLeft: 12,
      fontSize: 16,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.onSurface,
    },
    emptyState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
    },
    emptyStateIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.colors.placeholder + '15',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    emptyStateText: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.placeholder,
      textAlign: "center",
      marginTop: 8,
    },
    emptyStateSubtext: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.placeholder,
      textAlign: "center",
      marginTop: 4,
    },
  });

  useFocusEffect(
    useCallback(() => {
      getNotifications();
    }, [getNotifications])
  );

  const getNotifications = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from("expenses")
        .select(
          `
        expense_id,
        created_at,
        amount,
        is_paid,
        description,
        payer_id,
        users:payer_id (first_name)
      `
        )
        .eq("is_paid", false)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const items = data.map((expense) => ({
        id: expense.expense_id,
        amount: expense.amount,
        date: expense.created_at,
        isPaid: expense.is_paid,
        description: expense.description,
        type: userId === expense.payer_id ? "receive" : "send",
        payee: {
          id: expense.payer_id,
          name: userId === expense.payer_id ? "You" : expense.users?.first_name,
        },
      }));

      const combinedItems = items.reduce((acc, item) => {
        if (item.type === "receive") {
          const existingItem = acc.find(
            (i) => i.type === "receive" && i.id === item.id
          );

          if (existingItem) {
            existingItem.amount += item.amount;
            existingItem.date =
              new Date(existingItem.date) > new Date(item.date)
                ? existingItem.date
                : item.date;
          } else {
            acc.push({ ...item });
          }
        } else {
          acc.push({ ...item });
        }
        return acc;
      }, []);

      try {
        const { data: rentData, error } = await supabase.rpc(
          "get_tenant_payment_info",
          {
            p_tenant_id: userId,
          }
        );
        if (rentData) {
          const oneWeek = 7 * 24 * 60 * 60 * 1000; // milliseconds in a week
          const now = new Date();

          const rentItems = rentData
            .filter((rent) => {
              const dueDate = new Date(rent.next_payment);
              const warningDate = new Date(dueDate.getTime() - oneWeek);
              return now >= warningDate && now <= dueDate;
            })
            .map((rent) => {
              const dueDate = new Date(rent.next_payment);
              const warningDate = new Date(dueDate.getTime() - oneWeek);
              return {
                id: `rent-${rent.payment_id}-${warningDate.getTime()}`,
                amount: rent.monthly_rent,
                date: warningDate,
                dueDate: rent.next_payment,
                isPaid: false,
                description: "Rent Payment",
                type: "rent",
              };
            });
          setNotifications([...combinedItems, ...rentItems]);
          return;
        }
        console.error(error);
      } catch (error) {
        console.error(error);
      }

      setNotifications(combinedItems);
    } catch (error) {
      console.error("Error fetching notifications:", error.message);
    } finally {
      setRefreshing(false);
    }
  }, [userId]);

  const filterNotifications = (items) => {
    const filtered =
      filterBy === "all"
        ? items
        : items.filter((item) => item.type === filterBy);
    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>Notifications</ThemedText>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterMenuVisible(true)}
        >
          <MaterialIcons name="sort" size={20} color={theme.colors.primary} />
          <ThemedText style={styles.filterButtonText}>
            {filterBy === "all" ? "All" : 
             filterBy === "rent" ? "Rent" :
             filterBy === "receive" ? "Receiving" : "Sending"}
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <Modal
        visible={filterMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFilterMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setFilterMenuVisible(false)}
        >
          <ThemedView style={styles.filterMenu}>
            <TouchableOpacity
              style={styles.filterMenuItem}
              onPress={() => {
                setFilterBy("all");
                setFilterMenuVisible(false);
              }}
            >
              <MaterialIcons name="list" size={20} color={theme.colors.primary} />
              <ThemedText style={styles.filterMenuText}>Show All</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterMenuItem}
              onPress={() => {
                setFilterBy("rent");
                setFilterMenuVisible(false);
              }}
            >
              <MaterialIcons name="home" size={20} color={theme.colors.primary} />
              <ThemedText style={styles.filterMenuText}>Rent</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterMenuItem}
              onPress={() => {
                setFilterBy("receive");
                setFilterMenuVisible(false);
              }}
            >
              <MaterialIcons name="arrow-downward" size={20} color={theme.colors.success} />
              <ThemedText style={styles.filterMenuText}>Receiving</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterMenuItem, { borderBottomWidth: 0 }]}
              onPress={() => {
                setFilterBy("send");
                setFilterMenuVisible(false);
              }}
            >
              <MaterialIcons name="arrow-upward" size={20} color={theme.colors.error} />
              <ThemedText style={styles.filterMenuText}>Sending</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </TouchableOpacity>
      </Modal>

      <FlatList
        data={filterNotifications(notifications)}
        renderItem={({ item }) => <NotificationItem item={item} theme={theme} />}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={getNotifications}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyStateIcon}>
              <MaterialIcons name="notifications-off" size={32} color={theme.colors.placeholder} />
            </View>
            <ThemedText style={styles.emptyStateText}>
              No notifications to show
            </ThemedText>
            <ThemedText style={styles.emptyStateSubtext}>
              {filterBy === "all" ? "You're all caught up!" :
               filterBy === "rent" ? "No rent notifications" :
               filterBy === "receive" ? "No incoming payments" : "No outgoing payments"}
            </ThemedText>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default NotificationsScreen;
