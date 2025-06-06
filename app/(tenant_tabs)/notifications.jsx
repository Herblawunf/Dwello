import { useState, useCallback, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  Modal,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { useFocusEffect } from "@react-navigation/native";
import { Context as AuthContext } from "@/context/AuthContext";
import { formatDate } from "@/tools/formatDate";
import { MaterialIcons } from "@expo/vector-icons";

const NotificationItem = ({ item }) => (
  <View style={styles.notificationItem}>
    <Text style={styles.notificationTitle}>
      {item.type === "rent"
        ? "Rent Payment Due"
        : `${item.payee.name} added ${item.description}`}
    </Text>
    <Text style={styles.notificationMessage}>
      {item.type === "rent"
        ? `Due date: ${formatDate(item.dueDate, (reverse = true))}`
        : `You ${
            item.type === "receive" ? "will receive" : "owe"
          } £${item.amount.toFixed(2)}`}
    </Text>
    <Text style={styles.notificationTime}>
      {item.type === "rent"
        ? `Amount: £${item.amount.toFixed(2)}`
        : formatDate(item.date)}
    </Text>
  </View>
);

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filterBy, setFilterBy] = useState("all");
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const { state: authState } = useContext(AuthContext);
  const userId = authState.userId;

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
                id: `rent-${rent.payment_id}`,
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterMenuVisible(true)}
        >
          <MaterialIcons name="sort" size={24} color="#757575" />
        </TouchableOpacity>
      </View>

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
          <View style={styles.filterMenu}>
            <TouchableOpacity
              style={styles.filterMenuItem}
              onPress={() => {
                setFilterBy("all");
                setFilterMenuVisible(false);
              }}
            >
              <MaterialIcons name="list" size={20} color="#757575" />
              <Text style={styles.filterMenuText}>Show All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterMenuItem}
              onPress={() => {
                setFilterBy("rent");
                setFilterMenuVisible(false);
              }}
            >
              <MaterialIcons name="home" size={20} color="#757575" />
              <Text style={styles.filterMenuText}>Rent</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterMenuItem}
              onPress={() => {
                setFilterBy("receive");
                setFilterMenuVisible(false);
              }}
            >
              <MaterialIcons name="arrow-downward" size={20} color="#757575" />
              <Text style={styles.filterMenuText}>Receiving</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterMenuItem}
              onPress={() => {
                setFilterBy("send");
                setFilterMenuVisible(false);
              }}
            >
              <MaterialIcons name="arrow-upward" size={20} color="#757575" />
              <Text style={styles.filterMenuText}>Sending</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <FlatList
        data={filterNotifications(notifications)}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  filterButton: {
    padding: 8,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-start",
  },
  filterMenu: {
    position: "absolute",
    right: 8,
    top: 56,
    backgroundColor: "white",
    borderRadius: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  filterMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  filterMenuText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#212121",
  },
});

export default NotificationsScreen;
