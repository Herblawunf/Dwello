import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { useFocusEffect } from "@react-navigation/native";

const NotificationItem = ({ item }) => (
  <View style={styles.notificationItem}>
    <Text style={styles.notificationTitle}>{item.amount}</Text>
    <Text style={styles.notificationMessage}>{item.payee.name}</Text>
    <Text style={styles.notificationTime}>{item.date}</Text>
  </View>
);

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getNotifications();
    }, [])
  );

  const getNotifications = async () => {
    setRefreshing(true);
    // Policy ensures only userId payers are selected
    try {
      const { data, error } = await supabase
        .from("expenses")
        .select(
          `
        expense_id,
        created_at,
        amount,
        is_paid,
        housemate_id,
        payer_id,
        users:housemate_id (first_name)
      `
        )
        .eq("is_paid", false)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const items = data.map((expense) => ({
        id: expense.expense_id,
        amount: expense.amount,
        date: expense.created_at,
        isPaid: expense.status,
        payee: {
          id: expense.housemate_id,
          name: expense.users?.first_name,
        },
      }));
      setNotifications(items);
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
