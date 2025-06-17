import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Dimensions,
  SafeAreaView
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useData } from '../components/DataProvider';
import { LinearGradient } from 'expo-linear-gradient';
import ExpenseModal from '@/app/components/ExpenseModal';

const { width } = Dimensions.get('window');
const cardWidth = width * 0.44;

export default function InsightsScreen() {
  const router = useRouter();
  const dataContext = useData();
  
  // State for property selection
  const [selectedProperty, setSelectedProperty] = useState(null);
  
  // Add Expense modal state
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  
  // Metrics to display (will be populated from API data or use fallbacks)
  const [metrics, setMetrics] = useState({
    occupancyRate: { value: '0%', change: '0%', icon: 'home-outline', color: '#4CAF50', gradient: ['#E8F5E9', '#C8E6C9'] },
    grossIncome: { value: '£0', change: '0%', icon: 'cash-outline', color: '#2196F3', gradient: ['#E3F2FD', '#BBDEFB'] },
    totalExpenses: { value: '£0', change: '0%', icon: 'wallet-outline', color: '#F44336', gradient: ['#FFEBEE', '#FFCDD2'] },
    netProfit: { value: '£0', change: '0%', icon: 'trending-up-outline', color: '#673AB7', gradient: ['#EDE7F6', '#D1C4E9'] },
    maintenanceCosts: { value: '£0', change: '0%', icon: 'hammer-outline', color: '#FF9800', gradient: ['#FFF3E0', '#FFE0B2'] },
    tenantSatisfaction: { value: '0%', change: '0%', icon: 'happy-outline', color: '#009688', gradient: ['#E0F2F1', '#B2DFDB'] },
    rentCollection: { value: '0%', change: '0%', icon: 'calendar-outline', color: '#3F51B5', gradient: ['#E8EAF6', '#C5CAE9'] },
    propertyValue: { value: '£0', change: '0%', icon: 'business-outline', color: '#795548', gradient: ['#EFEBE9', '#D7CCC8'] },
  });
  
  // Additional advanced metrics
  const [advancedMetrics, setAdvancedMetrics] = useState({
    yieldRate: { value: '0%', change: '0%', description: 'Annual return on property value' },
    vacancyRate: { value: '0%', change: '0%', description: 'Percentage of time property is vacant' },
    avgTenancyLength: { value: '0 months', change: '0%', description: 'Average length of tenancy' },
    maintenanceCostRatio: { value: '0%', change: '0%', description: 'Maintenance costs as % of income' },
    cashOnCashReturn: { value: '0%', change: '0%', description: 'Annual cash flow / total cash invested' },
    capRate: { value: '0%', change: '0%', description: 'Net operating income / property value' },
    operatingExpenseRatio: { value: '0%', change: '0%', description: 'Operating expenses / gross income' },
    debtServiceRatio: { value: '0%', change: '0%', description: 'Net operating income / debt service' }
  });

  // Destructure dataContext with fallback values
  const { 
    houses = [], 
    overviewMetrics = {}, 
    houseMetrics = {},
    maintenanceCosts = [], 
    loading = { houses: true, metrics: true }, 
    selectedTimeFrame = 'Monthly',
    setSelectedTimeFrame = () => {}
  } = dataContext || {};

  // Format currency values
  const formatCurrency = (value) => {
    if (value === undefined || value === null) return '£0';
    
    // If it's already a string with a currency symbol, return it
    if (typeof value === 'string' && value.startsWith('£')) return value;
    
    // Convert to number if it's a string without currency symbol
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    // Check if it's a valid number
    if (isNaN(numValue)) return '£0';
    
    // Format based on size
    if (numValue >= 1000000) {
      return `£${(numValue / 1000000).toFixed(1)}M`;
    } else if (numValue >= 1000) {
      return `£${(numValue / 1000).toFixed(1)}K`;
    } else {
      return `£${numValue.toFixed(0)}`;
    }
  };

  // Format percentage values
  const formatPercentage = (value) => {
    if (value === undefined || value === null) return '0%';
    
    // If it's already a string with a percentage symbol, extract the number
    if (typeof value === 'string' && value.includes('%')) {
      const numValue = parseFloat(value.replace('%', ''));
      if (isNaN(numValue)) return '0%';
      return `${numValue.toFixed(1)}%`;
    } 
    
    // If it's a number, format it
    if (typeof value === 'number') {
      if (isNaN(value)) return '0%';
      return `${value.toFixed(1)}%`;
    }
    
    return '0%';
  };
  
  // Format change values
  const formatChange = (change) => {
    if (!change) return '0%';
    
    if (typeof change === 'string' && (change.includes('+') || change.includes('-'))) {
      const numValue = parseFloat(change.replace('+', '').replace('-', '').replace('%', ''));
      if (isNaN(numValue)) return '0%';
      const sign = change.startsWith('-') ? '-' : '+';
      return `${sign}${numValue.toFixed(1)}%`;
    }
    
    return '0%';
  };

  // Update metrics when data changes or property selection changes
  useEffect(() => {
    // If overview tab is selected
    if (selectedProperty === null) {
      if (overviewMetrics && !loading.metrics) {
        // Update basic metrics from API data
        setMetrics(prev => ({
          ...prev,
          occupancyRate: { 
            ...prev.occupancyRate, 
            value: formatPercentage(overviewMetrics.occupancyRate?.value),
            change: formatChange(overviewMetrics.occupancyRate?.change)
          },
          grossIncome: { 
            ...prev.grossIncome, 
            value: formatCurrency(overviewMetrics.grossIncome?.value),
            change: formatChange(overviewMetrics.grossIncome?.change)
          },
          totalExpenses: { 
            ...prev.totalExpenses, 
            value: formatCurrency(overviewMetrics.totalExpenses?.value),
            change: formatChange(overviewMetrics.totalExpenses?.change)
          },
          netProfit: { 
            ...prev.netProfit, 
            value: formatCurrency(overviewMetrics.netProfit?.value),
            change: formatChange(overviewMetrics.netProfit?.change)
          },
          maintenanceCosts: { 
            ...prev.maintenanceCosts, 
            value: formatCurrency(overviewMetrics.maintenanceCosts?.value),
            change: formatChange(overviewMetrics.maintenanceCosts?.change)
          },
          tenantSatisfaction: { 
            ...prev.tenantSatisfaction, 
            value: formatPercentage(overviewMetrics.tenantSatisfaction?.value),
            change: formatChange(overviewMetrics.tenantSatisfaction?.change)
          },
          rentCollection: { 
            ...prev.rentCollection, 
            value: formatPercentage(overviewMetrics.rentCollection?.value),
            change: formatChange(overviewMetrics.rentCollection?.change)
          },
          propertyValue: { 
            ...prev.propertyValue, 
            value: formatCurrency(overviewMetrics.propertyValue?.value),
            change: formatChange(overviewMetrics.propertyValue?.change)
          }
        }));
        
        // Update advanced metrics with sample data
        setAdvancedMetrics(prev => ({
          ...prev,
          yieldRate: { ...prev.yieldRate, value: '6.8%', change: '+0.4%' },
          vacancyRate: { ...prev.vacancyRate, value: '2.5%', change: '-1.2%' },
          avgTenancyLength: { ...prev.avgTenancyLength, value: '28 months', change: '+10%' },
          maintenanceCostRatio: { ...prev.maintenanceCostRatio, value: '12%', change: '-2%' },
          cashOnCashReturn: { ...prev.cashOnCashReturn, value: '7.2%', change: '+0.5%' },
          capRate: { ...prev.capRate, value: '5.8%', change: '+0.3%' },
          operatingExpenseRatio: { ...prev.operatingExpenseRatio, value: '35%', change: '-3%' },
          debtServiceRatio: { ...prev.debtServiceRatio, value: '1.8', change: '+0.2' }
        }));
      }
    } 
    // If a specific property is selected
    else if (selectedProperty && houseMetrics) {
      const houseId = selectedProperty.house_id || selectedProperty;
      const houseData = houseMetrics[houseId];
      
      if (houseData) {
        // Update metrics with house-specific data
        setMetrics(prev => ({
          ...prev,
          occupancyRate: { 
            ...prev.occupancyRate, 
            value: formatPercentage(houseData.occupancyRate?.value),
            change: formatChange(houseData.occupancyRate?.change)
          },
          grossIncome: { 
            ...prev.grossIncome, 
            value: formatCurrency(houseData.grossIncome?.value),
            change: formatChange(houseData.grossIncome?.change)
          },
          totalExpenses: { 
            ...prev.totalExpenses, 
            value: formatCurrency(houseData.totalExpenses?.value),
            change: formatChange(houseData.totalExpenses?.change)
          },
          netProfit: { 
            ...prev.netProfit, 
            value: formatCurrency(houseData.netProfit?.value),
            change: formatChange(houseData.netProfit?.change)
          },
          maintenanceCosts: { 
            ...prev.maintenanceCosts, 
            value: formatCurrency(houseData.maintenanceCosts?.value),
            change: formatChange(houseData.maintenanceCosts?.change)
          },
          tenantSatisfaction: { 
            ...prev.tenantSatisfaction, 
            value: formatPercentage(houseData.tenantSatisfaction?.value),
            change: formatChange(houseData.tenantSatisfaction?.change)
          },
          rentCollection: { 
            ...prev.rentCollection, 
            value: formatPercentage(houseData.rentCollection?.value),
            change: formatChange(houseData.rentCollection?.change)
          },
          propertyValue: { 
            ...prev.propertyValue, 
            value: formatCurrency(houseData.propertyValue?.value),
            change: formatChange(houseData.propertyValue?.change)
          }
        }));
        
        // Update house-specific advanced metrics if available
        if (houseData.yieldRate) {
          setAdvancedMetrics(prev => ({
            ...prev,
            yieldRate: { 
              ...prev.yieldRate, 
              value: formatPercentage(houseData.yieldRate?.value),
              change: formatChange(houseData.yieldRate?.change)
            },
            vacancyRate: { 
              ...prev.vacancyRate, 
              value: formatPercentage(houseData.vacancyRate?.value),
              change: formatChange(houseData.vacancyRate?.change)
            },
            avgTenancyLength: { 
              ...prev.avgTenancyLength, 
              value: `${Math.round(houseData.avgTenancyLength?.value || 0)} months`,
              change: formatChange(houseData.avgTenancyLength?.change)
            },
            maintenanceCostRatio: { 
              ...prev.maintenanceCostRatio, 
              value: formatPercentage(houseData.maintenanceCostRatio?.value),
              change: formatChange(houseData.maintenanceCostRatio?.change)
            }
          }));
        }
      }
    }
    
    // Update maintenance costs if available
    if (maintenanceCosts?.length > 0 && !loading.maintenance && selectedProperty === null) {
      const totalMaintenance = maintenanceCosts.reduce((sum, item) => sum + item.amount, 0);
      setMetrics(prev => ({
        ...prev,
        maintenanceCosts: { 
          ...prev.maintenanceCosts, 
          value: formatCurrency(totalMaintenance),
          change: '-8%' // Sample change value
        }
      }));
    }
  }, [overviewMetrics, maintenanceCosts, loading, selectedProperty, houseMetrics]);

  // Handle property selection
  const handlePropertySelect = (property) => {
    setSelectedProperty(property);
  };
  
  // Handle time frame selection
  const handleTimeFrameSelect = (period) => {
    setSelectedTimeFrame(period);
  };

  // Handle metric card click
  const handleMetricClick = (metricKey, metricName) => {
    router.push({
      pathname: "/(landlord_tabs)/metric_details",
      params: { metricKey, metricName, propertyId: selectedProperty?.house_id }
    });
  };

  // Handle navigation back to dashboard
  const handleGoToDashboard = () => {
    router.push("/(landlord_tabs)/");
  };

  // Handle chat navigation
  const handleGoToChat = () => {
    router.push("/ChatWindow");
  };
  
  // Handle expense added (refresh data)
  const handleExpenseAdded = () => {
    // Refresh metrics data
    console.log("Expense added, refreshing data...");
    // In a real app, you would refetch data here
  };

  // Handle case where data context is not available or show loading state
  if (!dataContext || loading.houses || loading.metrics) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoToDashboard} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Insights</Text>
          <TouchableOpacity onPress={handleGoToChat} style={styles.chatButton}>
            <Ionicons name="chatbubble-ellipses-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading insights...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoToDashboard} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Insights</Text>
        <TouchableOpacity onPress={handleGoToChat} style={styles.chatButton}>
          <Ionicons name="chatbubble-ellipses-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Property Selection Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.tabsContainer}
          contentContainerStyle={styles.tabsContentContainer}
        >
          <TouchableOpacity 
            style={[
              styles.propertyTab, 
              selectedProperty === null && styles.activePropertyTab
            ]}
            onPress={() => handlePropertySelect(null)}
          >
            <Text style={[
              styles.propertyTabText,
              selectedProperty === null && styles.activePropertyTabText
            ]}>Overview</Text>
          </TouchableOpacity>
          
          {houses.map((property, index) => (
            <TouchableOpacity 
              key={property.house_id || index}
              style={[
                styles.propertyTab, 
                selectedProperty?.house_id === property.house_id && styles.activePropertyTab
              ]}
              onPress={() => handlePropertySelect(property)}
            >
              <Text style={[
                styles.propertyTabText,
                selectedProperty?.house_id === property.house_id && styles.activePropertyTabText
              ]}>{property.name || `Property ${index + 1}`}</Text>
            </TouchableOpacity>
          ))}
          
          {/* Fallback if no properties are loaded */}
          {(!houses || houses.length === 0) && (
            <>
              <TouchableOpacity 
                style={[
                  styles.propertyTab, 
                  selectedProperty === 'bridgewater' && styles.activePropertyTab
                ]}
                onPress={() => handlePropertySelect('bridgewater')}
              >
                <Text style={[
                  styles.propertyTabText,
                  selectedProperty === 'bridgewater' && styles.activePropertyTabText
                ]}>Bridgewater Road</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.propertyTab, 
                  selectedProperty === 'oak' && styles.activePropertyTab
                ]}
                onPress={() => handlePropertySelect('oak')}
              >
                <Text style={[
                  styles.propertyTabText,
                  selectedProperty === 'oak' && styles.activePropertyTabText
                ]}>Oak Avenue</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
        
        {/* Time Frame Selection */}
        <View style={styles.timeFrameContainer}>
          {['Monthly', 'Quarterly', 'Annual'].map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.timeFrameButton,
                selectedTimeFrame === period && styles.activeTimeFrameButton
              ]}
              onPress={() => handleTimeFrameSelect(period)}
            >
              <Text style={[
                styles.timeFrameText,
                selectedTimeFrame === period && styles.activeTimeFrameText
              ]}>{period}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Key Metrics Grid */}
        <Text style={styles.sectionTitle}>Key Metrics</Text>
        <View style={styles.metricsGrid}>
          {Object.entries(metrics).slice(0, 6).map(([key, metric]) => (
            <TouchableOpacity 
              key={key}
              style={styles.metricCard}
              onPress={() => handleMetricClick(key, formatMetricName(key))}
            >
              <LinearGradient
                colors={metric.gradient}
                style={styles.metricGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name={metric.icon} size={24} color={metric.color} />
                <Text style={styles.metricName}>{formatMetricName(key)}</Text>
                <Text style={styles.metricValue}>{metric.value}</Text>
                <View style={styles.metricChangeContainer}>
                  <Ionicons 
                    name={metric.change.startsWith('-') ? 'arrow-down-outline' : 'arrow-up-outline'} 
                    size={14} 
                    color={metric.change.startsWith('-') ? '#F44336' : '#4CAF50'} 
                  />
                  <Text style={[
                    styles.metricChange,
                    { color: metric.change.startsWith('-') ? '#F44336' : '#4CAF50' }
                  ]}>{metric.change}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Advanced Metrics */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>Advanced Metrics</Text>
            <Ionicons name="information-circle-outline" size={16} color="#666" style={styles.infoIcon} />
          </View>
        </View>
        
        <View style={styles.advancedMetricsContainer}>
          {Object.entries(advancedMetrics).slice(0, 4).map(([key, metric]) => (
            <View 
              key={key} 
              style={styles.advancedMetricRow}
            >
              <View>
                <Text style={styles.advancedMetricName}>{formatMetricName(key)}</Text>
                <Text style={styles.advancedMetricDescription}>{metric.description}</Text>
              </View>
              <View style={styles.advancedMetricValueContainer}>
                <Text style={styles.advancedMetricValue}>{metric.value}</Text>
                <View style={[styles.metricChangeContainer, styles.advancedMetricChangeContainer]}>
                  <Ionicons 
                    name={metric.change.startsWith('-') ? 'arrow-down-outline' : 'arrow-up-outline'} 
                    size={12} 
                    color={metric.change.startsWith('-') ? '#F44336' : '#4CAF50'} 
                  />
                  <Text style={[
                    styles.advancedMetricChange,
                    { color: metric.change.startsWith('-') ? '#F44336' : '#4CAF50' }
                  ]}>{metric.change}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
        
        {/* Insights Cards */}
        <Text style={styles.sectionTitle}>Insights</Text>
        
        <TouchableOpacity 
          style={styles.insightCard}
          onPress={() => handleMetricClick('netProfit', 'Net Profit')}
        >
          <View style={styles.insightIconContainer}>
            <MaterialCommunityIcons name="chart-line" size={24} color="#FFF" />
          </View>
          <View style={styles.insightContent}>
            <Text style={styles.insightTitle}>Performance Analysis</Text>
            <Text style={styles.insightDescription}>
              {selectedProperty ? 
                `This property's net profit has ${selectedTimeFrame === 'Annual' ? 'increased by 15%' : 
                  selectedTimeFrame === 'Quarterly' ? 'increased by 12%' : 'increased by 8%'} compared to last ${selectedTimeFrame.toLowerCase().slice(0, -2)}` : 
                `Your overall portfolio net profit has ${selectedTimeFrame === 'Annual' ? 'increased by 12%' : 
                  selectedTimeFrame === 'Quarterly' ? 'increased by 9%' : 'increased by 6%'} compared to last ${selectedTimeFrame.toLowerCase().slice(0, -2)}`
              }
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#888" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.insightCard}
          onPress={() => setShowExpenseModal(true)}
        >
          <View style={[styles.insightIconContainer, { backgroundColor: '#FF9800' }]}>
            <MaterialCommunityIcons name="wallet-plus" size={24} color="#FFF" />
          </View>
          <View style={styles.insightContent}>
            <Text style={styles.insightTitle}>Expense Management</Text>
            <Text style={styles.insightDescription}>
              {selectedProperty ? 
                `Add and track expenses for ${selectedProperty.name || 'this property'} to stay on top of your finances` : 
                'Add and track expenses across your entire portfolio to optimize your cash flow'
              }
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#888" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.insightCard}
          onPress={() => handleMetricClick('grossIncome', 'Gross Income')}
        >
          <View style={[styles.insightIconContainer, { backgroundColor: '#4CAF50' }]}>
            <MaterialCommunityIcons name="cash-multiple" size={24} color="#FFF" />
          </View>
          <View style={styles.insightContent}>
            <Text style={styles.insightTitle}>Cash Flow Forecast</Text>
            <Text style={styles.insightDescription}>
              {selectedProperty ? 
                `Projected income for next ${selectedTimeFrame.toLowerCase()} shows a ${selectedTimeFrame === 'Annual' ? '9%' : 
                  selectedTimeFrame === 'Quarterly' ? '7%' : '5%'} increase` : 
                `Projected income for next ${selectedTimeFrame.toLowerCase()} shows a ${selectedTimeFrame === 'Annual' ? '10%' : 
                  selectedTimeFrame === 'Quarterly' ? '7%' : '4%'} increase`
              }
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#888" />
        </TouchableOpacity>
      </ScrollView>
      
      {/* Add Expense Modal */}
      <ExpenseModal
        visible={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        properties={houses}
        onExpenseAdded={handleExpenseAdded}
      />
    </SafeAreaView>
  );
}

// Format metric name for display
function formatMetricName(key) {
  const names = {
    occupancyRate: 'Occupancy Rate',
    grossIncome: 'Gross Income',
    totalExpenses: 'Total Expenses',
    netProfit: 'Net Profit',
    maintenanceCosts: 'Maintenance',
    tenantSatisfaction: 'Tenant Satisfaction',
    rentCollection: 'Rent Collection',
    propertyValue: 'Property Value',
    yieldRate: 'Yield Rate',
    vacancyRate: 'Vacancy Rate',
    avgTenancyLength: 'Avg. Tenancy Length',
    maintenanceCostRatio: 'Maintenance Cost Ratio',
    cashOnCashReturn: 'Cash-on-Cash Return',
    capRate: 'Cap Rate',
    operatingExpenseRatio: 'Operating Expense Ratio',
    debtServiceRatio: 'Debt Service Ratio'
  };
  
  return names[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  chatButton: {
    padding: 8,
    borderRadius: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 20,
  },
  tabsContainer: {
    marginBottom: 16,
  },
  tabsContentContainer: {
    paddingRight: 16,
  },
  propertyTab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#F5F5F5',
  },
  activePropertyTab: {
    backgroundColor: '#007AFF',
  },
  propertyTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activePropertyTabText: {
    color: '#FFF',
  },
  timeFrameContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 4,
  },
  timeFrameButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTimeFrameButton: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  timeFrameText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTimeFrameText: {
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 24,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginLeft: 8,
  },
  seeAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  metricCard: {
    width: cardWidth,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  metricGradient: {
    padding: 16,
    height: 140,
  },
  metricName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginTop: 12,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  metricChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  metricChange: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 2,
  },
  advancedMetricsContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  advancedMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  advancedMetricName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  advancedMetricDescription: {
    fontSize: 12,
    color: '#888',
    maxWidth: width * 0.6,
  },
  advancedMetricValueContainer: {
    alignItems: 'flex-end',
  },
  advancedMetricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  advancedMetricChangeContainer: {
    marginTop: 0,
    alignSelf: 'flex-end',
  },
  advancedMetricChange: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 2,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  insightIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  addExpenseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d0e8ff',
  },
  actionButtonIcon: {
    marginRight: 6,
  },
  addExpenseText: {
    color: '#007AFF',
    fontWeight: '500',
    fontSize: 14,
  },
}); 