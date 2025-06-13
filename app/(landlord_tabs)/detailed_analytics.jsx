import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import FinancialBarChart from "./data_analytics_";

const ADDRESSES = [
  "Maple Street",
  "Cedar Avenue",
  "Bridgewater Road",
  // Add more addresses as needed
];

const sortedAddresses = [...ADDRESSES].sort();
const TABS = ["Overview", ...sortedAddresses];

const METRICS_DATA = {
  'Jan 2024 - Jun 2024': {
    Monthly: [
      { key: "totalIncome", label: "Total Income", value: "£2,100", icon: "cash-outline", tooltip: "Sum of all rent and payments received in the selected month." },
      { key: "overdueRent", label: "Overdue Rent", value: "£200", icon: "alert-circle-outline", tooltip: "Total rent payments that are overdue." },
      { key: "utilityExpenses", label: "Utility Expenses", value: "£380", icon: "water-outline", tooltip: "Total spent on utilities (water, gas, electricity, etc.)." },
      { key: "occupancyRate", label: "Occupancy Rate", value: "95%", icon: "people-outline", tooltip: "Percentage of time properties were occupied." },
      { key: "maintenanceCosts", label: "Maintenance Costs", value: "£120", icon: "construct-outline", tooltip: "Total spent on property maintenance and repairs." },
    ],
    Quarterly: [
      { key: "totalIncome", label: "Total Income", value: "£6,200", icon: "cash-outline", tooltip: "Sum of all rent and payments received in the selected quarter." },
      { key: "overdueRent", label: "Overdue Rent", value: "£600", icon: "alert-circle-outline", tooltip: "Total rent payments that are overdue." },
      { key: "utilityExpenses", label: "Utility Expenses", value: "£1,100", icon: "water-outline", tooltip: "Total spent on utilities (water, gas, electricity, etc.)." },
      { key: "occupancyRate", label: "Occupancy Rate", value: "93%", icon: "people-outline", tooltip: "Percentage of time properties were occupied." },
      { key: "maintenanceCosts", label: "Maintenance Costs", value: "£350", icon: "construct-outline", tooltip: "Total spent on property maintenance and repairs." },
    ],
    Annual: [
      { key: "totalIncome", label: "Total Income", value: "£12,500", icon: "cash-outline", tooltip: "Sum of all rent and payments received in the selected year." },
      { key: "overdueRent", label: "Overdue Rent", value: "£1,200", icon: "alert-circle-outline", tooltip: "Total rent payments that are overdue." },
      { key: "utilityExpenses", label: "Utility Expenses", value: "£2,300", icon: "water-outline", tooltip: "Total spent on utilities (water, gas, electricity, etc.)." },
      { key: "occupancyRate", label: "Occupancy Rate", value: "92%", icon: "people-outline", tooltip: "Percentage of time properties were occupied." },
      { key: "maintenanceCosts", label: "Maintenance Costs", value: "£800", icon: "construct-outline", tooltip: "Total spent on property maintenance and repairs." },
    ],
  },
  'Jul 2024 - Dec 2024': {
    Monthly: [
      { key: "totalIncome", label: "Total Income", value: "£2,300", icon: "cash-outline", tooltip: "Sum of all rent and payments received in the selected month." },
      { key: "overdueRent", label: "Overdue Rent", value: "£150", icon: "alert-circle-outline", tooltip: "Total rent payments that are overdue." },
      { key: "utilityExpenses", label: "Utility Expenses", value: "£410", icon: "water-outline", tooltip: "Total spent on utilities (water, gas, electricity, etc.)." },
      { key: "occupancyRate", label: "Occupancy Rate", value: "97%", icon: "people-outline", tooltip: "Percentage of time properties were occupied." },
      { key: "maintenanceCosts", label: "Maintenance Costs", value: "£140", icon: "construct-outline", tooltip: "Total spent on property maintenance and repairs." },
    ],
    Quarterly: [
      { key: "totalIncome", label: "Total Income", value: "£6,800", icon: "cash-outline", tooltip: "Sum of all rent and payments received in the selected quarter." },
      { key: "overdueRent", label: "Overdue Rent", value: "£400", icon: "alert-circle-outline", tooltip: "Total rent payments that are overdue." },
      { key: "utilityExpenses", label: "Utility Expenses", value: "£1,200", icon: "water-outline", tooltip: "Total spent on utilities (water, gas, electricity, etc.)." },
      { key: "occupancyRate", label: "Occupancy Rate", value: "96%", icon: "people-outline", tooltip: "Percentage of time properties were occupied." },
      { key: "maintenanceCosts", label: "Maintenance Costs", value: "£420", icon: "construct-outline", tooltip: "Total spent on property maintenance and repairs." },
    ],
    Annual: [
      { key: "totalIncome", label: "Total Income", value: "£13,800", icon: "cash-outline", tooltip: "Sum of all rent and payments received in the selected year." },
      { key: "overdueRent", label: "Overdue Rent", value: "£1,000", icon: "alert-circle-outline", tooltip: "Total rent payments that are overdue." },
      { key: "utilityExpenses", label: "Utility Expenses", value: "£2,500", icon: "water-outline", tooltip: "Total spent on utilities (water, gas, electricity, etc.)." },
      { key: "occupancyRate", label: "Occupancy Rate", value: "94%", icon: "people-outline", tooltip: "Percentage of time properties were occupied." },
      { key: "maintenanceCosts", label: "Maintenance Costs", value: "£900", icon: "construct-outline", tooltip: "Total spent on property maintenance and repairs." },
    ],
  },
};

const PERIODS = ["Monthly", "Quarterly", "Annual"];

function formatDate(date) {
  return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Add property-specific metrics data
const PROPERTY_METRICS = {
    'Bridgewater Road': {
        Monthly: {
            occupancyRate: { value: '95%', change: '+2%' },
            maintenanceCosts: { value: '£450', change: '-15%' },
            grossIncome: { value: '£1,200', change: '+5%' },
            totalExpenses: { value: '£650', change: '-8%' },
            netProfit: { value: '£550', change: '+12%' },
            roi: { value: '8.2%', change: '+0.5%' }
        },
        Quarterly: {
            occupancyRate: { value: '92%', change: '+1%' },
            maintenanceCosts: { value: '£1,350', change: '-12%' },
            grossIncome: { value: '£3,600', change: '+4%' },
            totalExpenses: { value: '£1,950', change: '-6%' },
            netProfit: { value: '£1,650', change: '+10%' },
            roi: { value: '7.8%', change: '+0.3%' }
        },
        Annual: {
            occupancyRate: { value: '90%', change: '+3%' },
            maintenanceCosts: { value: '£5,400', change: '-10%' },
            grossIncome: { value: '£14,400', change: '+6%' },
            totalExpenses: { value: '£7,800', change: '-5%' },
            netProfit: { value: '£6,600', change: '+15%' },
            roi: { value: '7.5%', change: '+0.8%' }
        }
    },
    'Oak Avenue': {
        Monthly: {
            occupancyRate: { value: '98%', change: '+3%' },
            maintenanceCosts: { value: '£380', change: '-20%' },
            grossIncome: { value: '£1,500', change: '+8%' },
            totalExpenses: { value: '£580', change: '-12%' },
            netProfit: { value: '£920', change: '+18%' },
            roi: { value: '9.5%', change: '+0.7%' }
        },
        Quarterly: {
            occupancyRate: { value: '96%', change: '+2%' },
            maintenanceCosts: { value: '£1,140', change: '-15%' },
            grossIncome: { value: '£4,500', change: '+6%' },
            totalExpenses: { value: '£1,740', change: '-8%' },
            netProfit: { value: '£2,760', change: '+15%' },
            roi: { value: '9.2%', change: '+0.5%' }
        },
        Annual: {
            occupancyRate: { value: '94%', change: '+4%' },
            maintenanceCosts: { value: '£4,560', change: '-12%' },
            grossIncome: { value: '£18,000', change: '+7%' },
            totalExpenses: { value: '£6,960', change: '-6%' },
            netProfit: { value: '£11,040', change: '+20%' },
            roi: { value: '8.8%', change: '+1.0%' }
        }
    }
};

export default function DetailedAnalyticsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Overview");
  const [selectedPeriod, setSelectedPeriod] = useState("Monthly");
  const [tooltip, setTooltip] = useState(null);
  const [dateRange, setDateRange] = useState('Jan 2024 - Jun 2024');
  const [expandedSections, setExpandedSections] = useState({
    maintenance: true,
    income: true,
    property: true
  });
  const [expandedGraphs, setExpandedGraphs] = useState({
    'Bridgewater Road': false,
    'Oak Avenue': false
  });

  const handleGoToChat = () => {
    router.push("/chats");
  };

  // Sample properties data
  const [properties] = useState([
    {
      id: 1,
      name: "Bridgewater Road",
      rent: 1200,
      paymentHistory: [
        { month: "Jan", paid: true, daysLate: 0 },
        { month: "Feb", paid: true, daysLate: 0 },
        { month: "Mar", paid: true, daysLate: 2 },
        { month: "Apr", paid: true, daysLate: 0 },
        { month: "May", paid: true, daysLate: 5 },
        { month: "Jun", paid: true, daysLate: 0 },
      ],
      maintenance: [
        { category: "Plumbing", amount: 150.00, percentage: 30 },
        { category: "Electrical", amount: 120.00, percentage: 24 },
        { category: "HVAC", amount: 80.00, percentage: 16 },
        { category: "General Repairs", amount: 150.00, percentage: 30 },
      ],
      monthlyStats: [
        { net: 1000, util: 200 },
        { net: 1000, util: 250 },
        { net: 900, util: 150 },
        { net: 1000, util: 200 },
        { net: 700, util: 100 },
        { net: 600, util: 100 },
      ]
    },
    {
      id: 2,
      name: "Oak Avenue",
      rent: 1500,
      paymentHistory: [
        { month: "Jan", paid: true, daysLate: 0 },
        { month: "Feb", paid: true, daysLate: 0 },
        { month: "Mar", paid: true, daysLate: 0 },
        { month: "Apr", paid: true, daysLate: 3 },
        { month: "May", paid: true, daysLate: 0 },
        { month: "Jun", paid: true, daysLate: 0 },
      ],
      maintenance: [
        { category: "Plumbing", amount: 200.00, percentage: 35 },
        { category: "Electrical", amount: 100.00, percentage: 17 },
        { category: "HVAC", amount: 150.00, percentage: 26 },
        { category: "General Repairs", amount: 120.00, percentage: 21 },
      ],
      monthlyStats: [
        { net: 1200, util: 300 },
        { net: 1200, util: 350 },
        { net: 1100, util: 250 },
        { net: 1200, util: 300 },
        { net: 900, util: 200 },
        { net: 800, util: 200 },
      ]
    }
  ]);

  // Sample monthly stats for the stacked bar chart
  const [monthlyStats] = useState([
    { net: 1000, util: 400 }, // Jan
    { net: 1000, util: 550 }, // Feb
    { net: 900,  util: 300 }, // Mar
    { net: 1000, util: 350 }, // Apr
    { net: 700, util: 200 }, // May
    { net: 600, util: 200 }, // Jun
  ]);
  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

  // Sample maintenance data
  const [maintenanceData] = useState([
    { category: "Plumbing", amount: 450.00, percentage: 25 },
    { category: "Electrical", amount: 320.00, percentage: 18 },
    { category: "HVAC", amount: 280.00, percentage: 16 },
    { category: "General Repairs", amount: 650.00, percentage: 37 },
    { category: "Emergency", amount: 100.00, percentage: 4 },
  ]);

  const toggleDateRange = () => {
    setDateRange(prev => {
      const newRange = prev === 'Jan 2024 - Jun 2024' ? 'Jul 2024 - Dec 2024' : 'Jan 2024 - Jun 2024';
      setSelectedPeriod(null); // Unhighlight period toggle
      return newRange;
    });
  };

  const handleShowTooltip = (metric) => {
    setTooltip(metric);
  };

  const handleHideTooltip = () => {
    setTooltip(null);
  };

  const handleTabPress = (tab) => {
    setActiveTab(tab);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleGraph = (property) => {
    setExpandedGraphs(prev => ({
      ...prev,
      [property]: !prev[property]
    }));
  };

  const renderSectionHeader = (title, section) => (
    <TouchableOpacity 
      style={styles.sectionHeader} 
      onPress={() => toggleSection(section)}
    >
      <Text style={styles.sectionTitle}>{title}</Text>
      <Ionicons 
        name={expandedSections[section] ? "chevron-up" : "chevron-down"} 
        size={20} 
        color="#333" 
      />
    </TouchableOpacity>
  );

  const calculateLateDays = (property) => {
    return property.paymentHistory.reduce((total, payment) => total + payment.daysLate, 0);
  };

  const calculateOnTimePercentage = (property) => {
    const onTimePayments = property.paymentHistory.filter(payment => payment.daysLate === 0).length;
    return (onTimePayments / property.paymentHistory.length) * 100;
  };

  const renderPropertyMetrics = (property) => (
    <View style={styles.section}>
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Total Late Days</Text>
          <Text style={styles.metricValue}>{calculateLateDays(property)}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>On-Time Payment %</Text>
          <Text style={styles.metricValue}>{calculateOnTimePercentage(property).toFixed(1)}%</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Monthly Rent</Text>
          <Text style={styles.metricValue}>£{property.rent}</Text>
        </View>
      </View>

      {/* Property-specific Maintenance Costs */}
      <View style={[styles.section, { marginTop: 20 }]}>
        {renderSectionHeader("Maintenance Costs", "maintenance")}
        {expandedSections.maintenance && (
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 2 }]}>Category</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText]}>Amount</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText]}>% of Total</Text>
            </View>
            {property.maintenance.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2 }]}>{item.category}</Text>
                <Text style={styles.tableCell}>£{item.amount.toFixed(2)}</Text>
                <Text style={styles.tableCell}>{item.percentage}%</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Property-specific Income Graph */}
      <View style={[styles.section, { marginTop: 20 }]}>
        {renderSectionHeader("Income & Expenses", "income")}
        {expandedSections.income && (
          <View style={styles.graphContainer}>
            <FinancialBarChart
              data={property.monthlyStats}
              labels={monthLabels}
              suffix="£"
            />
          </View>
        )}
      </View>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
        case 'Overview':
            return (
                <>
                    {/* Date Range and Period Selection */}
                    <View style={styles.section}>
                        <View style={styles.rowBetween}>
                            <Text style={styles.sectionTitle}>Key Metrics</Text>
                            <TouchableOpacity style={styles.dateRangeButton} onPress={toggleDateRange}>
                                <Ionicons name="calendar-outline" size={18} color="#007AFF" />
                                <Text style={styles.dateRangeText}>{dateRange}</Text>
                            </TouchableOpacity>
                        </View>
                        
                        {/* Period Toggle */}
                        <View style={styles.periodToggleRow}>
                            {PERIODS.map((period) => (
                                <TouchableOpacity
                                    key={period}
                                    style={[
                                        styles.periodToggle,
                                        selectedPeriod === period && styles.periodToggleActive
                                    ]}
                                    onPress={() => setSelectedPeriod(period)}
                                >
                                    <Text style={[
                                        styles.periodToggleText,
                                        selectedPeriod === period && styles.periodToggleTextActive
                                    ]}>
                                        {period}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Metrics Grid */}
                        <View style={styles.metricsGrid}>
                            {(selectedPeriod ? METRICS_DATA[dateRange][selectedPeriod] : []).map((metric) => (
                                <View key={metric.key} style={styles.metricCard}>
                                    <View style={styles.metricIconRow}>
                                        <Ionicons name={metric.icon} size={22} color="#007AFF" />
                                        <TouchableOpacity onPress={() => handleShowTooltip(metric)}>
                                            <Ionicons 
                                                name="information-circle-outline" 
                                                size={18} 
                                                color="#888" 
                                                style={{ marginLeft: 6 }} 
                                            />
                                        </TouchableOpacity>
                                    </View>
                                    <Text style={styles.metricLabel} numberOfLines={1} ellipsizeMode="tail">
                                        {metric.label}
                                    </Text>
                                    <Text style={styles.metricValue}>{metric.value}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Overall Maintenance Costs */}
                    <View style={styles.section}>
                        {renderSectionHeader("Overall Maintenance Costs", "maintenance")}
                        {expandedSections.maintenance && (
                            <View style={styles.tableContainer}>
                                <View style={styles.tableHeader}>
                                    <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 2 }]}>Category</Text>
                                    <Text style={[styles.tableCell, styles.tableHeaderText]}>Amount</Text>
                                    <Text style={[styles.tableCell, styles.tableHeaderText]}>% of Total</Text>
                                </View>
                                {maintenanceData.map((item, index) => (
                                    <View key={index} style={styles.tableRow}>
                                        <Text style={[styles.tableCell, { flex: 2 }]}>{item.category}</Text>
                                        <Text style={styles.tableCell}>£{item.amount.toFixed(2)}</Text>
                                        <Text style={styles.tableCell}>{item.percentage}%</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Overall Income & Expenses Trend Graph */}
                    <View style={[styles.section, { marginTop: -10 }]}>
                        {renderSectionHeader("Overall Income & Expenses", "income")}
                        {expandedSections.income && (
                            <View style={styles.graphContainer}>
                                <FinancialBarChart
                                    data={monthlyStats}
                                    labels={monthLabels}
                                    suffix="£"
                                />
                            </View>
                        )}
                    </View>
                </>
            );
        case 'Bridgewater Road':
        case 'Oak Avenue':
            const propertyMetrics = PROPERTY_METRICS[activeTab][selectedPeriod];
            // Filter out ROI from metrics
            const filteredMetrics = Object.entries(propertyMetrics).filter(([key]) => key !== 'roi');
            
            return (
                <View style={styles.tabContent}>
                    <View style={styles.propertyMetricsContainer}>
                        <View style={styles.periodSelector}>
                            <TouchableOpacity 
                                style={[styles.periodButton, selectedPeriod === 'Monthly' && styles.periodButtonActive]}
                                onPress={() => setSelectedPeriod('Monthly')}
                            >
                                <Text style={[styles.periodButtonText, selectedPeriod === 'Monthly' && styles.periodButtonTextActive]}>
                                    Monthly
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.periodButton, selectedPeriod === 'Quarterly' && styles.periodButtonActive]}
                                onPress={() => setSelectedPeriod('Quarterly')}
                            >
                                <Text style={[styles.periodButtonText, selectedPeriod === 'Quarterly' && styles.periodButtonTextActive]}>
                                    Quarterly
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.periodButton, selectedPeriod === 'Annual' && styles.periodButtonActive]}
                                onPress={() => setSelectedPeriod('Annual')}
                            >
                                <Text style={[styles.periodButtonText, selectedPeriod === 'Annual' && styles.periodButtonTextActive]}>
                                    Annual
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.metricsGrid}>
                            {filteredMetrics.map(([key, metric]) => (
                                <TouchableOpacity
                                    key={key}
                                    style={styles.metricCard}
                                    onPress={() => {
                                        setTooltip({
                                            title: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
                                            description: METRICS_DATA[key].description
                                        });
                                    }}
                                >
                                    <View style={styles.metricIconRow}>
                                        <Text style={styles.metricLabel}>
                                            {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() => {
                                                setTooltip({
                                                    title: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
                                                    description: METRICS_DATA[key].description
                                                });
                                            }}
                                        >
                                            <Ionicons name="information-circle-outline" size={16} color="#666" />
                                        </TouchableOpacity>
                                    </View>
                                    <Text style={styles.metricValue}>{metric.value}</Text>
                                    <Text style={[
                                        styles.metricChange,
                                        metric.change.startsWith('+') ? styles.positiveChange : styles.negativeChange
                                    ]}>
                                        {metric.change}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            );
        default:
            return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER WITH TITLE + CHAT ICON */}
      <View style={styles.topBar}>
        <Text style={styles.header}>dwello</Text>
        <TouchableOpacity onPress={handleGoToChat} style={styles.chatButton}>
          <Ionicons name="chatbubble-ellipses-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.tabsScrollContent, { alignItems: 'center' }]}
        >
          <TouchableOpacity
            style={[styles.tab, activeTab === "Overview" && styles.activeTab]}
            onPress={() => setActiveTab("Overview")}
          >
            <Text style={[styles.tabText, activeTab === "Overview" && styles.activeTabText]}>
              Overview
            </Text>
          </TouchableOpacity>
          {properties.map(property => (
            <TouchableOpacity
              key={property.id}
              style={[styles.tab, activeTab === property.name && styles.activeTab]}
              onPress={() => setActiveTab(property.name)}
            >
              <Text style={[styles.tabText, activeTab === property.name && styles.activeTabText]}>
                {property.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {renderTabContent()}
      </ScrollView>

      {/* Tooltip Modal */}
      <Modal visible={!!tooltip} transparent animationType="fade" onRequestClose={handleHideTooltip}>
        <TouchableOpacity style={styles.tooltipOverlay} activeOpacity={1} onPress={handleHideTooltip}>
          <View style={styles.tooltipModal}>
            <Text style={styles.tooltipTitle}>{tooltip?.title}</Text>
            <Text style={styles.tooltipText}>{tooltip?.description}</Text>
            <TouchableOpacity onPress={handleHideTooltip} style={styles.tooltipCloseButton}>
              <Text style={styles.tooltipCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  backButton: {
    marginRight: 10,
    padding: 6,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  tabBarContainer: {
    paddingVertical: 0,
    paddingRight: 8,
    marginTop: 0,
    marginBottom: 8,
  },
  tabBarScroll: {
    marginTop: 0,
  },
  tabButton: {
    marginRight: 16,
    paddingBottom: 4,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tabIcon: {
    marginRight: 4,
  },
  tabText: {
    fontSize: 16,
    color: '#888',
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  tabTextActive: {
    color: '#222',
    fontWeight: '700',
  },
  tabUnderline: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    marginTop: 0,
  },
  analyticsScroll: {
    // No flex, so content starts at the top
  },
  analyticsContent: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  dateRangeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  dateRangeText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#007AFF',
  },
  periodToggleRow: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 4,
  },
  periodToggle: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  periodToggleActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  periodToggleText: {
    fontSize: 14,
    color: '#666',
  },
  periodToggleTextActive: {
    color: '#333',
    fontWeight: '500',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  metricCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    height: 100,
  },
  metricIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
    width: '100%',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 'auto',
  },
  section: {
    marginBottom: 8,
  },
  graphTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  graphContainer: {
    height: 200,
    width: '100%',
    marginTop: 8,
  },
  tooltipOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tooltipModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  tooltipTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  tooltipText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  tooltipCloseButton: {
    alignSelf: 'flex-end',
  },
  tooltipCloseText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  placeholderText: {
    fontSize: 16,
    color: "#888",
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  tabsScrollContent: {
    paddingHorizontal: 20,
    flexDirection: 'row',
  },
  tableContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EDEDED',
  },
  tableCell: {
    flex: 1,
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  tableHeaderText: {
    fontWeight: '700',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EDEDED',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  propertySelector: {
    marginBottom: 20,
  },
  selectorLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 10,
  },
  propertyButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  propertyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  selectedPropertyButton: {
    backgroundColor: "#333",
    borderColor: "#333",
  },
  propertyButtonText: {
    fontSize: 14,
    color: "#333",
  },
  selectedPropertyButtonText: {
    color: "#FFF",
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 15,
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#EDEDED',
    marginBottom: 20,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#333',
  },
  activeTabText: {
    color: '#333',
    fontWeight: '500',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
  },
  chatButton: {
    padding: 6,
  },
  graphHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
  },
  graphSection: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    marginTop: 0,
  },
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  periodButton: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  periodButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  periodButtonText: {
    fontSize: 14,
    color: '#666',
  },
  periodButtonTextActive: {
    color: '#333',
    fontWeight: '500',
  },
  metricChange: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  positiveChange: {
    color: '#007AFF',
  },
  negativeChange: {
    color: '#FF0000',
  },
  propertyMetricsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: 600, // Limit maximum width for better layout on larger screens
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    height: 120,
    marginBottom: 12,
  },
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    justifyContent: 'center',
    width: '100%',
  },
}); 