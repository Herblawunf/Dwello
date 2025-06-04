import { useState, useCallback, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { useFocusEffect } from "@react-navigation/native";
import { Context as AuthContext } from "@/context/AuthContext";
import { formatDate } from "@/tools/formatDate";

const NotificationItem = ({ item }) => (
  <View style={styles.notificationItem}>
    <Text style={styles.notificationTitle}>
      {item.payee.name} added {item.description}
    </Text>
    <Text style={styles.notificationMessage}>
      You {item.type == "receive" ? "will receive" : "owe"} £{item.amount}
    </Text>
    <Text style={styles.notificationTime}>{formatDate(item.date)}</Text>
  </View>
);

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const { state: authState } = useContext(AuthContext);
  const userId = authState.userId;

  useFocusEffect(
    useCallback(() => {
      getNotifications();
    }, [])
  );

  const getNotifications = async () => {
    setRefreshing(true);
    // Policy ensures only userId related expenses are selected
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
      console.log(userId);
      const items = data.map((expense) => ({
        id: expense.expense_id,
        amount: expense.amount,
        date: expense.created_at,
        isPaid: expense.status,
        description: expense.description,
        type: userId == expense.payer_id ? "receive" : "send",
        payee: {
          id: expense.payer_id,
          name: userId == expense.payer_id ? "You" : expense.users?.first_name,
        },
      }));

      const combinedItems = items.reduce((acc, item) => {
        if (item.type === "receive") {
          const existingItem = acc.find(
            (i) => i.type === "receive" && i.id === item.id
          );

          if (existingItem) {
            // Combine amounts and keep the most recent date
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

      setNotifications(combinedItems);
    } catch (error) {
      console.error("Error fetching notifications:", error.message);
      return [];
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>
      <FlatList
        data={notifications}
        renderItem={({ item }) => <NotificationItem item={item} />}
        keyExtractor={(item) => item.id}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={getNotifications}
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  list: {
    flex: 1,
    paddingHorizontal: 20,
  },
  notificationItem: {
    backgroundColor: "#fff",
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: "#999",
  },
});

export default NotificationsScreen;
