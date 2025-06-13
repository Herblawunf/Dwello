import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

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

export default function DetailedAnalyticsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Overview");
  const [selectedPeriod, setSelectedPeriod] = useState("Monthly");
  const [tooltip, setTooltip] = useState(null);
  const [dateRange, setDateRange] = useState('Jan 2024 - Jun 2024');

  const toggleDateRange = () => {
    setDateRange(prev => {
      const newRange = prev === 'Jan 2024 - Jun 2024' ? 'Jul 2024 - Dec 2024' : 'Jan 2024 - Jun 2024';
      setSelectedPeriod(null); // Unhighlight period toggle
      return newRange;
    });
  };

  // Placeholder for future: show/hide modal for tooltips
  const handleShowTooltip = (metric) => setTooltip(metric);
  const handleHideTooltip = () => setTooltip(null);

  const handleTabPress = (tab) => {
    setActiveTab(tab);
  };

  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.header}>Detailed Analytics</Text>
      </View>
      {/* Tab Navigation */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabBarContainer}
        style={styles.tabBarScroll}
      >
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={styles.tabButton}
            activeOpacity={0.7}
            onPress={() => handleTabPress(tab)}
          >
            <View style={styles.tabContent}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
              {activeTab === tab && <View style={styles.tabUnderline} />}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {/* Analytics Section for Overview */}
      {activeTab === "Overview" && (
        <ScrollView style={styles.analyticsScroll} contentContainerStyle={styles.analyticsContent}>
          {/* Date Range Selector */}
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Key Metrics</Text>
            <TouchableOpacity style={styles.dateRangeButton} onPress={toggleDateRange}>
              <Ionicons name="calendar-outline" size={18} color="#007AFF" />
              <Text style={styles.dateRangeText}>{dateRange}</Text>
            </TouchableOpacity>
          </View>
          {/* Comparative Period Toggle */}
          <View style={styles.periodToggleRow}>
            {PERIODS.map((period) => (
              <TouchableOpacity
                key={period}
                style={[styles.periodToggle, selectedPeriod === period && styles.periodToggleActive]}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text style={[styles.periodToggleText, selectedPeriod === period && styles.periodToggleTextActive]}>{period}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* Metrics Cards */}
          <View style={styles.metricsGrid}>
            {(selectedPeriod ? METRICS_DATA[dateRange][selectedPeriod] : []).map((metric) => (
              <View key={metric.key} style={styles.metricCard}>
                <View style={styles.metricIconRow}>
                  <Ionicons name={metric.icon} size={22} color="#007AFF" />
                  <TouchableOpacity onPress={() => handleShowTooltip(metric)}>
                    <Ionicons name="information-circle-outline" size={18} color="#888" style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                </View>
                <Text
                  style={styles.metricLabel}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {metric.label}
                </Text>
                <Text style={styles.metricValue}>{metric.value}</Text>
              </View>
            ))}
            {!selectedPeriod && (
              <Text style={{ color: '#888', width: '100%', textAlign: 'center', marginTop: 16 }}>
                Select a period above to view metrics.
              </Text>
            )}
          </View>
          {/* Placeholder for Graphs */}
          <View style={styles.graphSection}>
            <Text style={styles.graphTitle}>Income & Expenses Trend</Text>
            <View style={styles.graphPlaceholder}>
              <Text style={styles.graphPlaceholderText}>[Graph Placeholder]</Text>
            </View>
          </View>
          {/* More graphs/sections can be added here */}
        </ScrollView>
      )}
      {/* Tooltip Modal */}
      <Modal visible={!!tooltip} transparent animationType="fade" onRequestClose={handleHideTooltip}>
        <TouchableOpacity style={styles.tooltipOverlay} activeOpacity={1} onPress={handleHideTooltip}>
          <View style={styles.tooltipModal}>
            <Text style={styles.tooltipTitle}>{tooltip?.label}</Text>
            <Text style={styles.tooltipText}>{tooltip?.tooltip}</Text>
            <TouchableOpacity onPress={handleHideTooltip} style={styles.tooltipCloseButton}>
              <Text style={styles.tooltipCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      {/* Placeholder for other tabs */}
      {activeTab !== "Overview" && (
        <View style={styles.content}>
          <Text style={styles.placeholderText}>Analytics for {activeTab} coming soon...</Text>
        </View>
      )}
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
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
    marginBottom: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dateRangeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F4F7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dateRangeText: {
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 4,
    fontSize: 14,
  },
  periodToggleRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  periodToggle: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F2F4F7',
    marginRight: 10,
  },
  periodToggleActive: {
    backgroundColor: '#007AFF',
  },
  periodToggleText: {
    color: '#555',
    fontWeight: '500',
    fontSize: 14,
  },
  periodToggleTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDEDED',
    padding: 16,
    width: '48%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
    minWidth: 150,
    maxWidth: '100%',
  },
  metricIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
    marginBottom: 2,
  },
  graphSection: {
    marginBottom: 32,
    marginTop: 0,
    width: '100%',
  },
  graphTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 8,
  },
  graphPlaceholder: {
    height: 180,
    backgroundColor: '#F2F4F7',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    width: '100%',
    overflow: 'hidden',
  },
  graphPlaceholderText: {
    color: '#888',
    fontSize: 16,
  },
  tooltipOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tooltipModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    maxWidth: 300,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  tooltipTitle: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 6,
    color: '#222',
  },
  tooltipText: {
    color: '#555',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  tooltipCloseButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  tooltipCloseText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  placeholderText: {
    fontSize: 16,
    color: "#888",
    textAlign: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 