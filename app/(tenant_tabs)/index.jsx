import React, { useState, useEffect, useCallback, useContext } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { getHousemates } from "../../context/utils";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Context as AuthContext } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

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
  const { data: rent_info } = await supabase
    .from("tenants")
    .select("*")
    .eq("tenant_id", user.id)
    .single();

  if (!rent_info) {
    return 0;
  }

  const next_payment = rent_info.next_payment;
  const rent_per_period =
    rent_info.monthly_rent * rent_info.months_per_payment;

  const today = new Date();
  const paymentDate = new Date(next_payment);

  return paymentDate <= today ? rent_per_period : 0;
};

const daysToRent = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: house_info } = await supabase
    .from("tenants")
    .select("*")
    .eq("tenant_id", user.id)
    .single();

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
  const theme = useTheme();

  const getBalance = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc("get_housemate_balances", {
        p_user_id: userId,
      });
      if (error) {
        console.error('Error fetching balance:', error);
        return;
      }
      if (data) {
        const totalBalance = data.reduce((sum, account) => sum + account.balance, 0);
        setBalance(totalBalance);
      }
    } catch (error) {
      console.error('Error in getBalance:', error);
    }
  }, [userId]);

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

  const handleReportRepair = () => {
    router.push("/requests");
  };

  const handleAddExpenses = () => {
    router.push("/expenses");
  };

  const handleGoToChat = () => {
    router.push("/(tenant_tabs)/chat");
  };

  const handleRentInfoPress = () => {
    router.push("/rent_info");
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      padding: theme.spacing.lg,
      paddingTop: theme.spacing.xxl,
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: theme.spacing.lg,
    },
    header: {
      color: theme.colors.primary,
      letterSpacing: 1.5,
    },
    chatButton: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.round,
      padding: theme.spacing.sm,
      ...theme.elevation.sm,
    },
    section: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      ...theme.elevation.sm,
    },
    sectionTitle: {
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.sm,
    },
    balanceAmount: {
      color: theme.colors.success,
    },
    smallText: {
      color: theme.colors.placeholder,
    },
    notificationText: {
      color: theme.colors.warning,
    },
    quickActionsContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
    },
    actionButton: {
      flex: 1,
      alignItems: "center",
      padding: theme.spacing.md,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      marginHorizontal: theme.spacing.xs,
      ...theme.elevation.sm,
    },
    actionText: {
      color: theme.colors.onPrimary,
      marginTop: theme.spacing.xs,
    },
  });

  return (
    <View style={styles.container}>
      {/* HEADER WITH TITLE + CHAT ICON */}
      <View style={styles.topBar}>
        <ThemedText type="title" style={styles.header}>dwello</ThemedText>
        <TouchableOpacity onPress={handleGoToChat} style={styles.chatButton}>
          <Ionicons name="chatbubble-ellipses-outline" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Balance Section */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Balance due</ThemedText>
        <ThemedText type="title" style={styles.balanceAmount}>£{due.toFixed(2)}</ThemedText>
      </ThemedView>

      {/* Splits Section */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Splits</ThemedText>
        <ThemedText type="default" style={styles.smallText}>{formatBalanceText(balance)}</ThemedText>
      </ThemedView>

      {/* Notifications Section */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Notifications</ThemedText>
        <TouchableOpacity onPress={handleRentInfoPress}>
          <ThemedText type="defaultSemiBold" style={styles.notificationText}>
            Rent payment due {dueIn > 0 ? `in ${dueIn} days` : dueIn === 0 ? "today" : "now"}
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* Quick Actions Section */}
      <ThemedText type="subtitle" style={styles.sectionTitle}>Quick actions</ThemedText>
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleReportRepair}
        >
          <Ionicons name="build-outline" size={24} color={theme.colors.onPrimary} />
          <ThemedText type="default" style={styles.actionText}>Report repair</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleAddExpenses}
        >
          <Ionicons name="add-circle-outline" size={24} color={theme.colors.onPrimary} />
          <ThemedText type="default" style={styles.actionText}>Add expenses</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="document-text-outline" size={24} color={theme.colors.onPrimary} />
          <ThemedText type="default" style={styles.actionText}>View documents</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

