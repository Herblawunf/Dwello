import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import FinancialBarChart from "./data_analytics_.jsx";
import { useData } from "../components/DataProvider";
import DataProvider from "../components/DataProvider";
import { colors } from "../theme/colors";
import { supabase } from "@/lib/supabase";
import { Context as AuthContext } from "@/context/AuthContext";

const { width } = Dimensions.get("window");
const cardWidth = width * 0.42;

function LandlordDashboardContent() {
  const router = useRouter();
  const data = useData();
  const [userData, setUserData] = useState(null);
  const { state: { userId } } = React.useContext(AuthContext);
  
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
  
  // Add debugging and safety checks
  // console.log("Data from context:", data);
  
  if (!data) {
    console.error("DataProvider context is not available. Make sure this component is wrapped with DataProvider.");
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Data provider not found</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  const { 
    properties, 
    overviewMetrics, 
    incomeExpensesTrend, 
    maintenanceCosts,
    loading,
    error
  } = data;
  
  // Handle error state
  if (error) {
    console.error("Data loading error:", error);
  }
  
  // Provide default loading object if undefined
  const safeLoading = loading || {};
  // Get month labels from the trend data
  const monthLabels = incomeExpensesTrend?.map(item => item.date) || [];

  // Calculate total income and expenses
  const totalIncome = overviewMetrics?.grossIncome?.value || "0";
  const totalExpenses = overviewMetrics?.totalExpenses?.value || "0";
  const netProfit = overviewMetrics?.netProfit?.value || "0";
  const occupancyRate = overviewMetrics?.occupancyRate?.value || "0";
  
  // Calculate upcoming rent payments (sample data)
  const upcomingPayments = [
    { property: "Bridgewater Road", amount: 1200, dueDate: "25 Jun 2024", status: "pending" },
    { property: "Oak Avenue", amount: 1500, dueDate: "28 Jun 2024", status: "pending" },
  ];
  
  // Calculate maintenance alerts (from maintenanceCosts)
  const maintenanceAlerts = maintenanceCosts?.length > 0 ? maintenanceCosts.slice(0, 2) : [];
  
  // Format currency values with 1 decimal place
  const formatCurrency = (value) => {
    if (value === undefined || value === null) return "0.0";
    
    // Convert to number if it's a string
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    // Check if it's a valid number
    if (isNaN(numValue)) return "0.0";
    
    return numValue.toFixed(1);
  };
  
  // Format percentage values with 1 decimal place
  const formatPercentage = (value) => {
    if (value === undefined || value === null) return "0.0";
    
    // If it's already a string with a percentage symbol, extract the number
    if (typeof value === 'string' && value.includes('%')) {
      const numValue = parseFloat(value.replace('%', ''));
      if (isNaN(numValue)) return "0.0";
      return numValue.toFixed(1);
    } 
    
    // If it's a number, format it
    if (typeof value === 'number') {
      if (isNaN(value)) return "0.0";
      return value.toFixed(1);
    }
    
    return "0.0";
  };
  
  // Format change values with 1 decimal place
  const formatChange = (change) => {
    if (!change) return "0.0%";
    
    if (typeof change === 'string' && (change.includes('+') || change.includes('-'))) {
      const numValue = parseFloat(change.replace('+', '').replace('-', '').replace('%', ''));
      if (isNaN(numValue)) return "0.0%";
      const sign = change.startsWith('-') ? '-' : '+';
      return `${sign}${numValue.toFixed(1)}%`;
    }
    
    return "0.0%";
  };
  
  const handleGoToChat = () => {
    router.push("/chat");
  };

  const handleGoToInsights = () => {
    router.push("/(landlord_tabs)/insights");
  };
  
  // Navigate to insights page with specific metric
  const handleGoToMetricDetails = (metricKey, metricName) => {
    router.push({
      pathname: "/(landlord_tabs)/metric_details",
      params: { metricKey, metricName }
    });
  };
  
  const handleGoToUpkeep = () => {
    router.push("/(landlord_tabs)/upkeep");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER WITH TITLE + CHAT ICON */}
        <View style={styles.topBar}>
          <Text style={styles.header}>dwello</Text>
          <TouchableOpacity onPress={handleGoToChat} style={styles.chatButton}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={24}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>
        
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeTitle}>Hello, {userData?.first_name || 'Landlord'}</Text>
            <Text style={styles.welcomeSubtitle}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </View>
          <View style={styles.propertiesCount}>
            <Text style={styles.propertiesCountNumber}>{properties?.length || 0}</Text>
            <Text style={styles.propertiesCountLabel}>Properties</Text>
          </View>
        </View>

        {/* Key Metrics Grid */}
        <Text style={styles.sectionTitle}>Key Metrics</Text>
        <View style={styles.metricsGrid}>
          <TouchableOpacity style={styles.metricCard} onPress={() => handleGoToMetricDetails('grossIncome', 'Monthly Income')}>
            <View style={[styles.metricIconContainer, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="cash-outline" size={24} color={colors.primary} />
            </View>
            <Text style={styles.metricLabel}>Monthly Income</Text>
            <Text style={styles.metricValue}>£{formatCurrency(totalIncome)}</Text>
            <Text style={styles.metricChange}>{formatChange(overviewMetrics?.grossIncome?.change)}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.metricCard} onPress={() => handleGoToMetricDetails('totalExpenses', 'Expenses')}>
            <View style={[styles.metricIconContainer, { backgroundColor: colors.error + '15' }]}>
              <Ionicons name="wallet-outline" size={24} color={colors.error} />
            </View>
            <Text style={styles.metricLabel}>Expenses</Text>
            <Text style={styles.metricValue}>£{formatCurrency(totalExpenses)}</Text>
            <Text style={styles.metricChange}>{formatChange(overviewMetrics?.totalExpenses?.change)}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.metricCard} onPress={() => handleGoToMetricDetails('netProfit', 'Net Profit')}>
            <View style={[styles.metricIconContainer, { backgroundColor: colors.success + '15' }]}>
              <Ionicons name="trending-up-outline" size={24} color={colors.success} />
            </View>
            <Text style={styles.metricLabel}>Net Profit</Text>
            <Text style={styles.metricValue}>£{formatCurrency(netProfit)}</Text>
            <Text style={styles.metricChange}>{formatChange(overviewMetrics?.netProfit?.change)}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.metricCard} onPress={() => handleGoToMetricDetails('occupancyRate', 'Occupancy Rate')}>
            <View style={[styles.metricIconContainer, { backgroundColor: colors.info + '15' }]}>
              <Ionicons name="home-outline" size={24} color={colors.info} />
            </View>
            <Text style={styles.metricLabel}>Occupancy</Text>
            <Text style={styles.metricValue}>{formatPercentage(occupancyRate)}%</Text>
            <Text style={styles.metricChange}>{formatChange(overviewMetrics?.occupancyRate?.change)}</Text>
          </TouchableOpacity>
        </View>

        {/* Financial Overview Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Financial Overview</Text>
            <TouchableOpacity onPress={handleGoToInsights}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.chartContainer}>
            {safeLoading.incomeExpenses ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading financial data...</Text>
              </View>
            ) : incomeExpensesTrend && incomeExpensesTrend.length > 0 ? (
              <FinancialBarChart
                data={incomeExpensesTrend}
                labels={monthLabels}
                suffix="£"
              />
            ) : (
              <View style={styles.loadingContainer}>
                <Text style={styles.errorText}>No financial data available</Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Upcoming Payments Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Payments</Text>
            <TouchableOpacity onPress={() => router.push("/(landlord_tabs)/properties")}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.upcomingPaymentsContainer}>
            {upcomingPayments.map((payment, index) => (
              <View key={index} style={styles.paymentCard}>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentProperty}>{payment.property}</Text>
                  <Text style={styles.paymentAmount}>£{payment.amount}</Text>
                </View>
                <View style={styles.paymentDetails}>
                  <Text style={styles.paymentDueDate}>Due {payment.dueDate}</Text>
                  <View style={[styles.paymentStatus, { backgroundColor: colors.warning + '15' }]}>
                    <Text style={[styles.paymentStatusText, { color: colors.warning }]}>
                      {payment.status}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
        
        {/* Maintenance Alerts Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Maintenance</Text>
            <TouchableOpacity onPress={handleGoToUpkeep}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.maintenanceContainer}>
            {maintenanceAlerts.length > 0 ? (
              maintenanceAlerts.map((alert, index) => (
                <View key={index} style={styles.maintenanceCard}>
                  <View style={[styles.maintenanceIconContainer, 
                    { backgroundColor: getCategoryColor(alert.category) }]}>
                    <Ionicons 
                      name={getCategoryIcon(alert.category)} 
                      size={20} 
                      color="#FFF" 
                    />
                  </View>
                  <View style={styles.maintenanceInfo}>
                    <Text style={styles.maintenanceCategory}>{alert.category}</Text>
                    <Text style={styles.maintenanceAmount}>£{formatCurrency(alert.amount)}</Text>
                  </View>
                  <TouchableOpacity style={styles.maintenanceAction}>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle-outline" size={48} color="#4CAF50" />
                <Text style={styles.emptyStateText}>No maintenance issues</Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => router.push("/(landlord_tabs)/add-property")}
          >
            <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
            <Text style={styles.quickActionText}>Add Property</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={handleGoToInsights}
          >
            <Ionicons name="analytics-outline" size={24} color="#007AFF" />
            <Text style={styles.quickActionText}>Analytics</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => router.push("/(landlord_tabs)/requests")}
          >
            <Ionicons name="construct-outline" size={24} color="#007AFF" />
            <Text style={styles.quickActionText}>Requests</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function LandlordDashboardScreen() {
  return (
    <DataProvider>
      <LandlordDashboardContent />
    </DataProvider>
  );
}

// Helper function to get color for maintenance category
function getCategoryColor(category) {
  switch (category) {
    case 'Plumbing': return '#2196F3';
    case 'Electrical': return '#FFC107';
    case 'HVAC': return '#F44336';
    case 'General Repairs': return '#4CAF50';
    default: return '#9E9E9E';
  }
}

// Helper function to get icon for maintenance category
function getCategoryIcon(category) {
  switch (category) {
    case 'Plumbing': return 'water-outline';
    case 'Electrical': return 'flash-outline';
    case 'HVAC': return 'thermometer-outline';
    case 'General Repairs': return 'hammer-outline';
    default: return 'build-outline';
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 16,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
  },
  chatButton: {
    padding: 8,
  },
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.onBackground,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: colors.placeholder,
  },
  propertiesCount: {
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    padding: 12,
    borderRadius: 12,
  },
  propertiesCountNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  propertiesCountLabel: {
    fontSize: 12,
    color: colors.primary,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.onBackground,
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
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: colors.onBackground,
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
    color: colors.placeholder,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.onBackground,
    marginBottom: 4,
  },
  metricChange: {
    fontSize: 12,
    color: colors.success,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    color: colors.primary,
    fontSize: 14,
  },
  chartContainer: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    shadowColor: colors.onBackground,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: colors.placeholder,
  },
  errorText: {
    color: colors.error,
  },
  upcomingPaymentsContainer: {
    gap: 12,
  },
  paymentCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    shadowColor: colors.onBackground,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentProperty: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onBackground,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  paymentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentDueDate: {
    fontSize: 14,
    color: colors.placeholder,
  },
  paymentStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  maintenanceContainer: {
    marginBottom: 8,
  },
  maintenanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  maintenanceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  maintenanceInfo: {
    flex: 1,
  },
  maintenanceCategory: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  maintenanceAmount: {
    fontSize: 14,
    color: '#666',
  },
  maintenanceAction: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 80,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginTop: 8,
  },
});