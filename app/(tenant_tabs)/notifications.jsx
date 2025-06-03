import React, { useState, useContext, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, SafeAreaView } from "react-native";
import { supabase } from "../../lib/supabase";
import { Context as AuthContext } from "@/context/AuthContext";
import { useFocusEffect } from "@react-navigation/native";

const getNotifications = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("expenses")
      .select(
        `
        expense_id,
        created_at,
        expense,
        is_paid,
        payee_id,
        payer_id,
        users:payee_id (first_name)
      `
      )
      .eq("payer_id", userId)
      .eq("is_paid", false)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data.map((expense) => ({
      id: expense.expense_id,
      amount: expense.expense,
      date: expense.created_at,
      isPaid: expense.status,
      payee: {
        id: expense.payee_id,
        name: expense.users?.first_name,
      },
    }));
  } catch (error) {
    console.error("Error fetching notifications:", error.message);
    return [];
  }
};

const NotificationItem = ({ item }) => (
  <View style={styles.notificationItem}>
    <Text style={styles.notificationTitle}>{item.expense}</Text>
    <Text style={styles.notificationMessage}>{item.payee.name}</Text>
    <Text style={styles.notificationTime}>{item.date}</Text>
  </View>
);

const NotificationsScreen = () => {
  const { state: authState } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);

  useFocusEffect(
    useCallback(() => {
      console.log(authState);
      setNotifications(getNotifications(authState.userId));
    }, [])
  );

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
