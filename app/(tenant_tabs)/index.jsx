import React, { useState, useEffect, useCallback, useContext } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Text,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Context as AuthContext } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { colors } from "../theme/colors";
import { TenantSatisfaction } from "@/app/components";

const { width } = Dimensions.get("window");
const cardWidth = width * 0.42;

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
  const [unreadCount, setUnreadCount] = useState(0);
  const [houseId, setHouseId] = useState(null);
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

  const fetchUnreadCount = useCallback(async () => {
    try {
      // Get the tenant's house
      const { data: tenantData, error: tenantError } = await supabase
        .from("tenants")
        .select("house_id")
        .eq("tenant_id", userId)
        .single();

      if (tenantError) throw tenantError;
      if (!tenantData?.house_id) return;

      // Get all chats for this house
      const { data: chats, error: chatError } = await supabase
        .from("chats")
        .select("group_id")
        .eq("house_id", tenantData.house_id);

      if (chatError) throw chatError;
      if (!chats?.length) return;

      // Get all request IDs to exclude
      const { data: requests, error: requestsError } = await supabase
        .from("requests")
        .select("request_id");

      if (requestsError) throw requestsError;

      // Filter out request groups from chats
      const requestIds = new Set(requests?.map(req => req.request_id) || []);
      const validGroupIds = chats
        .map(chat => chat.group_id)
        .filter(groupId => !requestIds.has(groupId));

      if (!validGroupIds.length) {
        setUnreadCount(0);
        return;
      }

      // Get all unread messages for valid groups
      const { data: unreadMessages, error: unreadError } = await supabase
        .from("messages")
        .select("message_id")
        .in("group_id", validGroupIds)
        .not("sender", "eq", userId);

      if (unreadError) throw unreadError;
      if (!unreadMessages?.length) {
        setUnreadCount(0);
        return;
      }

      // Get read messages for this user
      const { data: readMessages, error: readError } = await supabase
        .from("read_message")
        .select("message_id")
        .eq("user_id", userId)
        .in("message_id", unreadMessages.map(msg => msg.message_id));

      if (readError) throw readError;

      const readMessageIds = new Set(readMessages.map(msg => msg.message_id));
      const totalUnread = unreadMessages.filter(msg => !readMessageIds.has(msg.message_id)).length;
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [userId]);

  useEffect(() => {
    let subscription;

    const setupSubscription = async () => {
      // Clean up any existing subscription
      if (subscription) {
        await supabase.removeChannel(subscription);
      }

      // Create new subscription
      subscription = supabase
        .channel('public:messages')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'messages' },
          () => {
            fetchUnreadCount(); // Refresh unread count when new message arrives
          }
        )
        .subscribe();
    };

    fetchUnreadCount();
    setupSubscription();

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [userId, fetchUnreadCount]);

  useFocusEffect(
    useCallback(() => {
      getBalance();
      fetchUnreadCount();
    }, [getBalance, fetchUnreadCount])
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

  // Fetch house ID for tenant satisfaction component
  useEffect(() => {
    const fetchHouseId = async () => {
      try {
        const { data, error } = await supabase
          .from('tenants')
          .select('house_id')
          .eq('tenant_id', userId)
          .single();

        if (error) {
          console.error('Error fetching house ID:', error);
          return;
        }

        if (data?.house_id) {
          setHouseId(data.house_id);
        }
      } catch (error) {
        console.error('Error in fetchHouseId:', error);
      }
    };

    if (userId) {
      fetchHouseId();
    }
  }, [userId]);

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
      padding: theme.spacing.sm,
      position: 'relative',
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
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.onBackground,
      marginBottom: 16,
    },
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    metricCard: {
      width: cardWidth,
      backgroundColor: theme.colors.surface,
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
      shadowColor: theme.colors.onBackground,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    metricIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    metricLabel: {
      fontSize: 14,
      color: theme.colors.placeholder,
      marginBottom: 4,
    },
    metricValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.onBackground,
      marginBottom: 4,
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
    unreadBadge: {
      position: 'absolute',
      top: 2,
      right: 2,
      backgroundColor: colors.error,
      borderRadius: 8,
      minWidth: 16,
      height: 16,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 3,
    },
    unreadCount: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: 'bold',
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
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{unreadCount}</Text>
              </View>
            )}
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

        {/* Key Metrics Grid */}
        <ThemedText type="subtitle" style={styles.sectionTitle}>Overview</ThemedText>
        <View style={styles.metricsGrid}>
          <TouchableOpacity style={styles.metricCard} onPress={handleRentInfoPress}>
            <View style={[styles.metricIconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
              <Ionicons name="home-outline" size={24} color={theme.colors.primary} />
            </View>
            <ThemedText type="default" style={styles.metricLabel}>Rent Due</ThemedText>
            <ThemedText type="title" style={styles.metricValue}>£{due.toFixed(2)}</ThemedText>
            <ThemedText type="default" style={[styles.metricLabel, { color: theme.colors.warning }]}>
              {dueIn > 0 ? `Due in ${dueIn} days` : dueIn === 0 ? "Due today" : "Overdue"}
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.metricCard} onPress={handleAddExpenses}>
            <View style={[styles.metricIconContainer, { backgroundColor: theme.colors.success + '15' }]}>
              <Ionicons name="wallet-outline" size={24} color={theme.colors.success} />
            </View>
            <ThemedText type="default" style={styles.metricLabel}>Household Balance</ThemedText>
            <ThemedText type="title" style={styles.metricValue}>{formatBalanceText(balance)}</ThemedText>
            <ThemedText type="default" style={[styles.metricLabel, { color: balance > 0 ? theme.colors.success : balance < 0 ? theme.colors.error : theme.colors.placeholder }]}>
              {balance > 0 ? 'You are owed' : balance < 0 ? 'You owe' : 'No balance'}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.metricCard} onPress={handleReportRepair}>
            <View style={[styles.metricIconContainer, { backgroundColor: theme.colors.error + '15' }]}>
              <Ionicons name="construct-outline" size={24} color={theme.colors.error} />
            </View>
            <ThemedText type="default" style={styles.metricLabel}>Report Repair</ThemedText>
            <ThemedText type="title" style={styles.metricValue}>Request</ThemedText>
            <ThemedText type="default" style={[styles.metricLabel, { color: theme.colors.error }]}>
              1 open request
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.metricCard} onPress={() => router.push("/(tenant_tabs)/documents")}>
            <View style={[styles.metricIconContainer, { backgroundColor: theme.colors.info + '15' }]}>
              <Ionicons name="document-text-outline" size={24} color={theme.colors.info} />
            </View>
            <ThemedText type="default" style={styles.metricLabel}>Documents</ThemedText>
            <ThemedText type="title" style={styles.metricValue}>View</ThemedText>
            <ThemedText type="default" style={[styles.metricLabel, { color: theme.colors.info }]}>
              3 docs stored
            </ThemedText>
          </TouchableOpacity>
        </View>
        
        {/* Tenant Satisfaction Section - without title */}
        {userId && houseId && (
          <TenantSatisfaction tenantId={userId} propertyId={houseId} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}


