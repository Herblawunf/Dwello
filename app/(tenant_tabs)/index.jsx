import React, { useState, useEffect, useCallback, useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { getHousemates } from "../../context/utils";
import { useRouter } from "expo-router"; // Import useRouter
import { useFocusEffect } from "@react-navigation/native";
import { Context as AuthContext } from "@/context/AuthContext";

const formatBalanceText = (balance) => {
  if (balance > 0) {
    return `+£${balance.toFixed(2)}`;
  } else if (balance < 0) {
    return `-£${Math.abs(balance).toFixed(2)}`;
  } else {
    return `£0.00`;
  }
};

const rentDue = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: house_id } = await supabase
    .from("tenants")
    .select("house_id")
    .eq("tenant_id", user.id)
    .single();

  if (!house_id) {
    console.warn("No house_id found for user.");
    return 0;
  }

  const { data: house_info } = await supabase
    .from("houses")
    .select("*")
    .eq("house_id", house_id.house_id)
    .single();

  if (!house_info) {
    console.warn("No house_info found for house_id:", house_id.house_id);
    return 0;
  }

  const next_payment = house_info.next_payment;
  const rent_per_period =
    house_info.monthly_rent * house_info.months_per_payment;

  const today = new Date();
  const paymentDate = new Date(next_payment);

  const housemates = await getHousemates();
  const numHousemates = housemates.length + 1;
  const split = 1.0 / numHousemates;

  return paymentDate <= today ? rent_per_period * split : 0;
};

const daysToRent = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: house_id } = await supabase
    .from("tenants")
    .select("house_id")
    .eq("tenant_id", user.id)
    .single();

  if (!house_id) {
    console.warn("No house_id found for user.");
    return -1; // Or some other default/error value
  }

  const { data: house_info } = await supabase
    .from("houses")
    .select("*")
    .eq("house_id", house_id.house_id)
    .single();

  if (!house_info) {
    console.warn("No house_info found for house_id:", house_id.house_id);
    return -1; // Or some other default/error value
  }

  const next_payment = house_info.next_payment;

  const today = new Date();
  const paymentDate = new Date(next_payment);

  const timeDiff = paymentDate.getTime() - today.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

  return daysDiff;
};

export default function HomeScreen() {
  const [due, setDue] = useState(0);
  const [dueIn, setDueIn] = useState(-1);
  const [balance, setBalance] = useState(0);
  const router = useRouter();
  const { state: authState } = useContext(AuthContext);
  const userId = authState.userId;

  useEffect(() => {
    const fetchRentDue = async () => {
      const amount = await rentDue();
      setDue(amount);
    };
    fetchRentDue();
  }, []);

  useEffect(() => {
    const fetchDaysToRent = async () => {
      const days = await daysToRent();
      setDueIn(days);
    };
    fetchDaysToRent();
  }, []);

  useFocusEffect(
    useCallback(() => {
      getBalance();
    }, [getBalance])
  );

  const getBalance = async () => {
    try {
      const { data, error } = await supabase.rpc("get_housemate_balances", {
        p_user_id: userId,
      });
      if (data) {
        setBalance(data.reduce((sum, account) => sum + account.balance, 0));
        return;
      }
      console.log(error);
    } catch (error) {
      console.log(error);
    }
  };

  const handleReportRepair = () => {
    // Assuming your contact screen is routed as '/contact'
    // If contact.jsx is in (tenant_tabs), the path might be '/(tenant_tabs)/contact'
    // or simply 'contact' if it's a sibling route.
    // Adjust the path as per your file structure and routing setup.
    router.push("/contact");
  };

  const handleAddExpenses = () => {
    // Adjust the path as per your file structure and routing setup for expenses.jsx
    router.push("/expenses");
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.header}>dwello</Text>

      {/* Balance Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Balance due</Text>
        <Text style={styles.balanceAmount}>£{due.toFixed(2)}</Text>
      </View>

      {/* Splits Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Splits</Text>
        <Text style={styles.smallText}>{formatBalanceText(balance)}</Text>
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <Text style={styles.notificationText}>
          Rent payment due{" "}
          {dueIn > 0 ? `in ${dueIn} days` : dueIn === 0 ? "today" : "now"}
        </Text>
      </View>

      {/* Quick Actions Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick actions</Text>
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleReportRepair}
          >
            <Ionicons name="build-outline" size={24} color="#666" />
            <Text style={styles.actionText}>Report repair</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleAddExpenses}
          >
            <Ionicons name="add-circle-outline" size={24} color="#666" />
            <Text style={styles.actionText}>Add expenses</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="document-text-outline" size={24} color="#666" />
            <Text style={styles.actionText}>View documents</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 20,
    paddingTop: 60,
  },
  header: {
    fontSize: 28,
    fontWeight: "300",
    color: "#333",
    marginBottom: 40,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#333",
    marginBottom: 10,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: "600",
    color: "#333",
  },
  smallText: {
    fontSize: 14,
    color: "#666",
  },
  notificationText: {
    fontSize: 16,
    color: "#333",
  },
  quickActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  actionButton: {
    width: "30%",
    aspectRatio: 1,
    backgroundColor: "#F8F8F8",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  actionText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
  },
});
