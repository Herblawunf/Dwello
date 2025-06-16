import React, { useState, useEffect, useCallback, useContext } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Context as AuthContext } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

const formatBalanceText = (balance) => {
  if (balance != 0) {
    return `£${Math.abs(balance).toFixed(2)}`;
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
  const [userData, setUserData] = useState(null);
  const router = useRouter();
  const { state: authState } = useContext(AuthContext);
  const userId = authState.userId;
  const theme = useTheme();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('first_name')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('Error fetching user data:', error);
          return;
        }

        setUserData(data);
      } catch (error) {
        console.error('Error in fetchUserData:', error);
      }
    };

    fetchUserData();
  }, [userId]);

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
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    contentContainer: {
      padding: theme.spacing.lg,
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
    welcomeSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    welcomeContent: {
      flex: 1,
    },
    welcomeTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.onBackground,
      marginBottom: 4,
    },
    welcomeSubtitle: {
      fontSize: 16,
      color: theme.colors.placeholder,
    },
    balanceCount: {
      alignItems: 'center',
      backgroundColor: theme.colors.primary + '15',
      padding: 12,
      borderRadius: 12,
    },
    balanceCountNumber: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    balanceCountLabel: {
      fontSize: 12,
      color: theme.colors.primary,
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
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 80,
      marginTop: 10,
      ...theme.elevation.sm,
    },
    quickActionButton: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 10,
    },
    quickActionText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.onSurface,
      marginTop: 8,
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER WITH TITLE + CHAT ICON */}
        <View style={styles.topBar}>
          <ThemedText type="title" style={styles.header}>dwello</ThemedText>
          <TouchableOpacity onPress={handleGoToChat} style={styles.chatButton}>
            <Ionicons name="chatbubble-ellipses-outline" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeContent}>
            <ThemedText type="title" style={styles.welcomeTitle}>
              Hello, {userData?.first_name || 'Tenant'}
            </ThemedText>
            <ThemedText type="default" style={styles.welcomeSubtitle}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
            </ThemedText>
          </View>
          <TouchableOpacity onPress={handleRentInfoPress} style={styles.balanceCount}>
            <ThemedText type="title" style={styles.balanceCountNumber}>£{due.toFixed(2)}</ThemedText>
            <ThemedText type="default" style={styles.balanceCountLabel}>Due</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Splits Section */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Household Expenses</ThemedText>
          <ThemedText type="default" style={styles.smallText}>
            {balance > 0 ? 'You are owed ' : balance < 0 ? 'You owe ' : 'No balance '}
            {formatBalanceText(balance)}
          </ThemedText>
        </ThemedView>

        {/* Notifications Section */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Notifications</ThemedText>
          <ThemedText type="defaultSemiBold" style={styles.notificationText}>
            Rent payment due {dueIn > 0 ? `in ${dueIn} days` : dueIn === 0 ? "today" : "now"}
          </ThemedText>
        </ThemedView>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={handleReportRepair}
          >
            <Ionicons name="construct-outline" size={24} color={theme.colors.primary} />
            <ThemedText type="default" style={styles.quickActionText}>Report repair</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={handleAddExpenses}
          >
            <Ionicons name="add-circle-outline" size={24} color={theme.colors.primary} />
            <ThemedText type="default" style={styles.quickActionText}>Add expenses</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={handleRentInfoPress}
          >
            <Ionicons name="document-text-outline" size={24} color={theme.colors.primary} />
            <ThemedText type="default" style={styles.quickActionText}>Documents</ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


