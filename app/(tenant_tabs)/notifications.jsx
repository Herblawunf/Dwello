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
  const getIconColor = () => {
    switch (item.type) {
      case 'rent':
        return theme.colors.primary;
      case 'receive':
        return '#4CAF50'; // Green
      case 'send':
        return '#F44336'; // Red
      default:
        return theme.colors.placeholder;
    }
  };

  const getIcon = () => {
    switch (item.type) {
      case 'rent':
        return 'home';
      case 'receive':
        return 'arrow-downward';
      case 'send':
        return 'arrow-upward';
      default:
        return 'notifications';
    }
  };

  const styles = StyleSheet.create({
    notificationItem: {
      backgroundColor: theme.colors.surface,
      padding: 16,
      marginVertical: 8,
      borderRadius: 12,
      ...theme.elevation.sm,
    },
    notificationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    notificationIcon: {
      marginRight: 12,
    },
    notificationTitle: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.onSurface,
      flex: 1,
    },
    notificationMessage: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 8,
    },
    notificationTime: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.placeholder,
    },
    notificationFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
  });

  return (
    <ThemedView style={styles.notificationItem}>
      <ThemedView style={styles.notificationHeader}>
        <MaterialIcons
          name={getIcon()}
          size={24}
          color={getIconColor()}
          style={styles.notificationIcon}
        />
        <ThemedText style={styles.notificationTitle}>
          {item.type === "rent"
            ? "Rent Payment Due"
            : `${item.payee.name} added ${item.description}`}
        </ThemedText>
      </ThemedView>
      <ThemedText style={styles.notificationMessage}>
        {item.type === "rent"
          ? `Due date: ${formatDate(item.dueDate, (reverse = true))}`
          : `You ${
              item.type === "receive" ? "will receive" : "owe"
            } £${item.amount.toFixed(2)}`}
      </ThemedText>
      <ThemedView style={styles.notificationFooter}>
        <ThemedText style={styles.notificationTime}>
          {item.type === "rent"
            ? `Amount: £${item.amount.toFixed(2)}`
            : formatDate(item.date)}
        </ThemedText>
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
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
    headerTitle: {
      fontSize: 24,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.onBackground,
      paddingTop: 4,
    },
    filterButton: {
      padding: 8,
    },
    list: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: 20,
      paddingTop: 12,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-start",
    },
    filterMenu: {
      position: "absolute",
      right: 8,
      top: 56,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      ...theme.elevation.md,
    },
    filterMenuItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
    },
    filterMenuText: {
      marginLeft: 12,
      fontSize: 16,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.onSurface,
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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={[
        styles.header,
        {
          backgroundColor: theme.colors.background,
          paddingTop: insets.top + (Platform.OS === 'android' ? StatusBar.currentHeight : 0),
        }
      ]}>
        <ThemedText style={styles.headerTitle}>Notifications</ThemedText>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterMenuVisible(true)}
        >
          <MaterialIcons name="sort" size={24} color={theme.colors.placeholder} />
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
              <MaterialIcons name="list" size={20} color={theme.colors.placeholder} />
              <ThemedText style={styles.filterMenuText}>Show All</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterMenuItem}
              onPress={() => {
                setFilterBy("rent");
                setFilterMenuVisible(false);
              }}
            >
              <MaterialIcons name="home" size={20} color={theme.colors.placeholder} />
              <ThemedText style={styles.filterMenuText}>Rent</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterMenuItem}
              onPress={() => {
                setFilterBy("receive");
                setFilterMenuVisible(false);
              }}
            >
              <MaterialIcons name="arrow-downward" size={20} color={theme.colors.placeholder} />
              <ThemedText style={styles.filterMenuText}>Receiving</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterMenuItem}
              onPress={() => {
                setFilterBy("send");
                setFilterMenuVisible(false);
              }}
            >
              <MaterialIcons name="arrow-upward" size={20} color={theme.colors.placeholder} />
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
      />
    </View>
  );
};

export default NotificationsScreen;
