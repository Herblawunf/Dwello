import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Platform, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import FinancialBarChart from "./data_analytics_";
import { useData } from "../components/DataProvider";

const TABS = ["Overview"];

const METRICS_DATA = {
  occupancyRate: { 
    description: "The percentage of time the property is occupied by tenants."
  },
  maintenanceCosts: { 
    description: "Total costs spent on maintenance and repairs."
  },
  grossIncome: { 
    description: "Total rental income before expenses."
  },
  totalExpenses: { 
    description: "Sum of all expenses including maintenance, utilities, etc."
  },
  netProfit: { 
    description: "Gross income minus total expenses."
  },
  roi: { 
    description: "Return on investment as a percentage."
  }
};

const PERIODS = ["Monthly", "Quarterly", "Annual"];

function formatDate(date) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function DetailedAnalyticsScreen() {
  const router = useRouter();
  const { 
    properties, 
    overviewMetrics, 
    propertyMetrics, 
    maintenanceCosts, 
    incomeExpensesTrend,
    loading, 
    error, 
    dateRange, 
    setDateRange 
  } = useData();
  const [activeTab, setActiveTab] = useState("Overview");
  const [selectedPeriod, setSelectedPeriod] = useState("Monthly");
  const [tooltip, setTooltip] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    maintenance: true,
    income: true,
    property: true
  });
  
  // Get month labels from the trend data
  const monthLabels = incomeExpensesTrend?.map(item => item.date) || [];

  // Debug: Log data changes
  useEffect(() => {
    console.log("Detailed analytics - properties:", properties);
    console.log("Detailed analytics - propertyMetrics:", propertyMetrics);
    console.log("Detailed analytics - selectedPeriod:", selectedPeriod);
    console.log("Detailed analytics - activeTab:", activeTab);
  }, [properties, propertyMetrics, selectedPeriod, activeTab]);

  const handleGoToChat = () => {
    router.push("/ChatWindow");
  };

  const toggleDateRange = () => {
    setDateRange(prev => {
      if (prev.label === 'Jan 2024 - Jun 2024') {
        return {
          label: 'Jul 2024 - Dec 2024',
          start: '2024-07-01',
          end: '2024-12-31'
        };
      } else {
        return {
          label: 'Jan 2024 - Jun 2024',
          start: '2024-01-01',
          end: '2024-06-30'
        };
      }
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

  // Helper function to get a proper property name
  const getPropertyName = (property, index) => {
    // If property has a name field, use it
    if (property.name && property.name.trim()) {
      return property.name;
    }
    
    // If property has street_address, use it
    if (property.street_address && property.street_address.trim()) {
      return property.street_address;
    }
    
    // If property has postcode, create a name from it
    if (property.postcode && property.postcode.trim()) {
      return `Property ${property.postcode}`;
    }
    
    // If property has a code, use it
    if (property.code) {
      return `Property ${property.code}`;
    }
    
    // Final fallback
    return `Property ${index + 1}`;
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

  // Loading component
  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.loadingText}>Loading data...</Text>
    </View>
  );

  // Error component
  const renderError = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity 
        style={styles.retryButton}
        onPress={() => window.location.reload()}
      >
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "Overview":
        return (
          <>
            <View style={styles.overviewContainer}>
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
                {Object.entries(overviewMetrics).map(([key, value]) => (
                  <TouchableOpacity
                    key={key}
                    style={styles.metricCard}
                    onPress={() => {
                      setTooltip({
                        title: formatMetricName(key),
                        description: METRICS_DATA[key]?.description || ""
                      });
                    }}
                  >
                    <View style={styles.metricIconRow}>
                      <Text style={styles.metricLabel}>
                        {formatMetricName(key)}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          setTooltip({
                            title: formatMetricName(key),
                            description: METRICS_DATA[key]?.description || ""
                          });
                        }}
                      >
                        <Ionicons name="information-circle-outline" size={16} color="#666" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.metricValue}>
                      {formatMetricValue(value, key)}
                    </Text>
                    {value.change && (
                      <Text style={[
                        styles.metricChange,
                        value.change.startsWith('+') ? styles.positiveChange : styles.negativeChange
                      ]}>
                        {value.change}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        );
      default:
        // Handle individual property tabs
        // Find the property by matching the activeTab name
        const property = properties.find((p, index) => getPropertyName(p, index) === activeTab);
        if (!property) return <Text>Property not found</Text>;
        
        // Get the metrics for this property using house_id
        const propertyMetricsData = propertyMetrics[property.house_id];
        
        console.log("Property metrics for", property.house_id, ":", propertyMetricsData);
        console.log("Selected period:", selectedPeriod);
        
        // If we don't have the metrics yet, show loading
        if (loading.houseMetrics || !propertyMetricsData) {
          return (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Loading property data...</Text>
            </View>
          );
        }
        
        // Filter out ROI from metrics and format them for display
        const filteredMetrics = Object.entries(propertyMetricsData)
          .filter(([key]) => key !== 'roi' && !['id', 'property_id', 'date', 'created_at', 'period'].includes(key))
          .map(([key, value]) => [key, value]);
        
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
                {filteredMetrics.map(([key, value]) => (
                  <TouchableOpacity
                    key={key}
                    style={styles.metricCard}
                    onPress={() => {
                      setTooltip({
                        title: formatMetricName(key),
                        description: METRICS_DATA[key]?.description || ""
                      });
                    }}
                  >
                    <View style={styles.metricIconRow}>
                      <Text style={styles.metricLabel}>
                        {formatMetricName(key)}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          setTooltip({
                            title: formatMetricName(key),
                            description: METRICS_DATA[key]?.description || ""
                          });
                        }}
                      >
                        <Ionicons name="information-circle-outline" size={16} color="#666" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.metricValue}>
                      {formatMetricValue(value, key)}
                    </Text>
                    {value.change && (
                      <Text style={[
                        styles.metricChange,
                        value.change.startsWith('+') ? styles.positiveChange : styles.negativeChange
                      ]}>
                        {value.change}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );
    }
  };
  
  // Helper function to format metric names
  const formatMetricName = (key) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
  };
  
  // Helper function to format metric values
  const formatMetricValue = (value, type) => {
    if (typeof value === 'object') {
      return value.value; // For property metrics
    }
    
    if (typeof value !== 'string' && typeof value !== 'number') {
      return '—';
    }
    
    if (type === 'occupancyRate' || type === 'roi') {
      return `${value}%`;
    }
    
    if (type === 'maintenanceCosts' || type === 'grossIncome' || 
        type === 'totalExpenses' || type === 'netProfit') {
      return `£${value}`;
    }
    
    return value;
  };
  
  // Helper function to get icon for metric type
  const getIconForMetric = (type) => {
    switch (type) {
      case 'occupancyRate': return 'people-outline';
      case 'maintenanceCosts': return 'construct-outline';
      case 'grossIncome': return 'cash-outline';
      case 'totalExpenses': return 'trending-down-outline';
      case 'netProfit': return 'trending-up-outline';
      case 'roi': return 'pulse-outline';
      default: return 'stats-chart-outline';
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
          {properties.map((property, index) => (
            <TouchableOpacity
              key={property.house_id || property.id || index}
              style={[styles.tab, activeTab === getPropertyName(property, index) && styles.activeTab]}
              onPress={() => setActiveTab(getPropertyName(property, index))}
            >
              <Text style={[styles.tabText, activeTab === getPropertyName(property, index) && styles.activeTabText]}>
                {getPropertyName(property, index)}
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
      {tooltip && (
        <TouchableOpacity 
          style={styles.tooltipOverlay} 
          activeOpacity={1} 
          onPress={handleHideTooltip}
        >
          <View style={styles.tooltipContainer}>
            <Text style={styles.tooltipTitle}>{tooltip.title}</Text>
            <Text style={styles.tooltipDescription}>{tooltip.description}</Text>
            <TouchableOpacity 
              style={styles.tooltipCloseButton} 
              onPress={handleHideTooltip}
            >
              <Text style={styles.tooltipCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
  tooltipContainer: {
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
  tooltipDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  tooltipCloseButton: {
    alignSelf: 'flex-end',
  },
  tooltipCloseButtonText: {
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
  overviewContainer: {
    flex: 1,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 200,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  loadingSectionContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 200,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  metricCardLoading: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  maintenanceContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  maintenanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EDEDED',
  },
  maintenanceCategory: {
    flex: 1,
    marginRight: 10,
  },
  maintenanceCategoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  maintenanceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  maintenanceAmount: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  maintenancePercentage: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
}); 