import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useData } from '../components/DataProvider';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

export default function MetricDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const metricKey = params?.metricKey || 'occupancyRate';
  const metricName = params?.metricName || 'Occupancy Rate';
  const propertyId = params?.propertyId || null;
  
  const { 
    properties, 
    overviewMetrics, 
    maintenanceCosts, 
    incomeExpensesTrend,
    loading, 
    error,
    dateRange
  } = useData();

  // State for time period selection
  const [timeFrame, setTimeFrame] = useState('Monthly');
  
  // State for chart data
  const [propertyComparison, setPropertyComparison] = useState([]);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [totalMetrics, setTotalMetrics] = useState({});
  const [periodTotals, setPeriodTotals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get metric info based on the metric key
  const getMetricInfo = () => {
    const metricInfo = {
      occupancyRate: {
        title: 'Occupancy Rate',
        description: 'The percentage of time your properties are occupied by tenants.',
        icon: 'home-outline',
        color: '#4CAF50',
        gradient: ['#E8F5E9', '#C8E6C9'],
        format: (value) => `${value}%`,
        yAxisLabel: 'Occupancy (%)',
        benchmarkValue: '92%',
        benchmarkLabel: 'Market Average',
        insights: [
          'Higher occupancy rates directly correlate with increased annual revenue',
          'Properties with modern amenities show 8% higher occupancy rates',
          'Seasonal fluctuations affect occupancy by approximately 5-10%'
        ]
      },
      grossIncome: {
        title: 'Gross Income',
        description: 'Total rental income before expenses.',
        icon: 'cash-outline',
        color: '#2196F3',
        gradient: ['#E3F2FD', '#BBDEFB'],
        format: (value) => `£${value}`,
        yAxisLabel: 'Income (£)',
        benchmarkValue: '£1,350',
        benchmarkLabel: 'Market Average',
        insights: [
          'Your gross income is 15% above market average for similar properties',
          'Premium amenities contribute to 12% higher rental income',
          'Rental income growth outpaces inflation by 3% annually'
        ]
      },
      totalExpenses: {
        title: 'Total Expenses',
        description: 'Sum of all expenses including maintenance, utilities, etc.',
        icon: 'wallet-outline',
        color: '#F44336',
        gradient: ['#FFEBEE', '#FFCDD2'],
        format: (value) => `£${value}`,
        yAxisLabel: 'Expenses (£)',
        benchmarkValue: '£520',
        benchmarkLabel: 'Market Average',
        insights: [
          'Maintenance costs represent 45% of your total expenses',
          'Seasonal utility costs increase expenses by 15% in winter months',
          'Preventative maintenance could reduce annual expenses by 8-12%'
        ]
      },
      netProfit: {
        title: 'Net Profit',
        description: 'Gross income minus total expenses.',
        icon: 'trending-up-outline',
        color: '#673AB7',
        gradient: ['#EDE7F6', '#D1C4E9'],
        format: (value) => `£${value}`,
        yAxisLabel: 'Profit (£)',
        benchmarkValue: '£830',
        benchmarkLabel: 'Market Average',
        insights: [
          'Your profit margin is 22% higher than similar properties in the area',
          'Strategic renovations could increase net profit by up to 15%',
          'Tax optimization could improve bottom line by 5-8% annually'
        ]
      },
      maintenanceCosts: {
        title: 'Maintenance Costs',
        description: 'Total costs spent on maintenance and repairs.',
        icon: 'hammer-outline',
        color: '#FF9800',
        gradient: ['#FFF3E0', '#FFE0B2'],
        format: (value) => `£${value}`,
        yAxisLabel: 'Costs (£)',
        benchmarkValue: '£350',
        benchmarkLabel: 'Market Average',
        insights: [
          'Preventative maintenance reduces emergency repairs by 65%',
          'Properties older than 15 years show 30% higher maintenance costs',
          'Scheduled maintenance programs reduce annual costs by 18% on average'
        ]
      },
      tenantSatisfaction: {
        title: 'Tenant Satisfaction',
        description: 'Percentage of tenants reporting satisfaction with their rental experience.',
        icon: 'happy-outline',
        color: '#009688',
        gradient: ['#E0F2F1', '#B2DFDB'],
        format: (value) => `${value}%`,
        yAxisLabel: 'Satisfaction (%)',
        benchmarkValue: '85%',
        benchmarkLabel: 'Market Average',
        insights: [
          'Responsive maintenance increases tenant satisfaction by 25%',
          'Properties with modern amenities show 15% higher satisfaction scores',
          'Satisfied tenants stay 2.3x longer than dissatisfied tenants'
        ]
      },
      rentCollection: {
        title: 'Rent Collection',
        description: 'Percentage of rent collected on time.',
        icon: 'calendar-outline',
        color: '#3F51B5',
        gradient: ['#E8EAF6', '#C5CAE9'],
        format: (value) => `${value}%`,
        yAxisLabel: 'Collection Rate (%)',
        benchmarkValue: '94%',
        benchmarkLabel: 'Market Average',
        insights: [
          'Digital payment options improve on-time payments by 18%',
          'Flexible payment schedules reduce late payments by 22%',
          'Clear communication of payment terms improves collection rates by 15%'
        ]
      },
      propertyValue: {
        title: 'Property Value',
        description: 'Current estimated market value of your properties.',
        icon: 'business-outline',
        color: '#795548',
        gradient: ['#EFEBE9', '#D7CCC8'],
        format: (value) => `£${value}`,
        yAxisLabel: 'Value (£)',
        benchmarkValue: '£425,000',
        benchmarkLabel: 'Market Average',
        insights: [
          'Strategic renovations yield 1.5x return on investment in property value',
          'Location factors contribute 40% to overall property value',
          'Energy efficiency improvements increase property value by 6-8%'
        ]
      },
      yieldRate: {
        title: 'Yield Rate',
        description: 'Annual return on property value.',
        icon: 'stats-chart-outline',
        color: '#9C27B0',
        gradient: ['#F3E5F5', '#E1BEE7'],
        format: (value) => `${value}%`,
        yAxisLabel: 'Yield (%)',
        benchmarkValue: '5.8%',
        benchmarkLabel: 'Market Average',
        insights: [
          'Your properties outperform market average yield by 1.2%',
          'Higher-yield properties typically have lower appreciation rates',
          'Location efficiency contributes 35% to overall yield performance'
        ]
      },
    };

    return metricInfo[metricKey] || {
      title: metricName || 'Metric Details',
      description: 'Detailed view of this metric.',
      icon: 'analytics-outline',
      color: '#607D8B',
      gradient: ['#ECEFF1', '#CFD8DC'],
      format: (value) => value,
      yAxisLabel: 'Value',
      benchmarkValue: '0',
      benchmarkLabel: 'Market Average',
      insights: []
    };
  };

  const metricInfo = getMetricInfo();

  // Fetch data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch data from the property_analytics table
        await fetchAnalyticsData();
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [metricKey, timeFrame]);

  // Fetch from property_analytics table
  const fetchAnalyticsData = async () => {
    try {
      // Determine how many months to look back based on time frame
      const monthsToLookBack = timeFrame === 'Monthly' ? 1 : 
                             timeFrame === 'Quarterly' ? 3 : 12;
      
      const now = new Date();
      const startDate = new Date();
      startDate.setMonth(now.getMonth() - monthsToLookBack);
      
      // Query the database
      let query = supabase
        .from('property_analytics')
        .select('*')
        .gte('record_date', startDate.toISOString().split('T')[0])
        .order('record_date', { ascending: false });
        
      // Filter by property ID if provided
      if (propertyId) {
        query = query.eq('property_id', propertyId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching analytics data:", error);
        return;
      }
      
      if (!data || data.length === 0) {
        console.log("No analytics data found");
        setPropertyComparison([]);
        setAnalyticsData([]);
        setTotalMetrics({});
        setPeriodTotals([]);
        return;
      }
      
      console.log(`Fetched ${data.length} analytics records`);
      setAnalyticsData(data);
      
      // Process the data for property comparison
      processPropertyComparison(data);
      
      // Process data for totals and period breakdowns
      processTotalMetrics(data);
      processPeriodTotals(data);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
    }
  };
  
  // Process property comparison from analytics data
  const processPropertyComparison = (data) => {
    if (!data || data.length === 0) return;
    
    // Group data by property
    const propertyGroups = {};
    data.forEach(record => {
      if (!propertyGroups[record.property_id]) {
        propertyGroups[record.property_id] = [];
      }
      propertyGroups[record.property_id].push(record);
    });
    
    // Calculate aggregated metrics for each property
    const comparison = Object.entries(propertyGroups).map(([propertyId, records]) => {
      // Sort by date (most recent first)
      records.sort((a, b) => new Date(b.record_date) - new Date(a.record_date));
      
      // Get the property name from the most recent record
      const propertyName = records[0].property_name;
      
      // Aggregate values based on the metric
      let value = 0;
      let change = '+0.0%';
      
      if (metricKey === 'occupancyRate' || metricKey === 'tenantSatisfaction') {
        // For percentages, take the average
        value = records.reduce((sum, r) => sum + r[mapMetricKeyToDbField(metricKey)], 0) / records.length;
      } else {
        // For monetary values, sum them
        value = records.reduce((sum, r) => sum + r[mapMetricKeyToDbField(metricKey)], 0);
      }
      
      return {
        id: propertyId,
        name: propertyName,
        value,
        change
      };
    });
    
    setPropertyComparison(comparison);
  };
  
  // Process total metrics from analytics data
  const processTotalMetrics = (data) => {
    if (!data || data.length === 0) return;
    
    // Calculate overall totals for the chosen metric
    const fieldName = mapMetricKeyToDbField(metricKey);
    let totalValue = 0;
    
    if (metricKey === 'occupancyRate' || metricKey === 'tenantSatisfaction') {
      // For percentages, take the average
      totalValue = data.reduce((sum, r) => sum + r[fieldName], 0) / data.length;
    } else {
      // For monetary values, sum them
      totalValue = data.reduce((sum, r) => sum + r[fieldName], 0);
    }
    
    // Also calculate min, max, and average
    const values = data.map(r => r[fieldName]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    setTotalMetrics({
      total: totalValue,
      min,
      max,
      avg,
      count: data.length
    });
  };
  
  // Process period-based totals (monthly, quarterly, yearly breakdown)
  const processPeriodTotals = (data) => {
    if (!data || data.length === 0) return;
    
    const fieldName = mapMetricKeyToDbField(metricKey);
    
    // Group data by period according to selected timeframe
    const periodGroups = {};
    
    data.forEach(record => {
      let periodKey;
      
      if (timeFrame === 'Monthly') {
        periodKey = `${record.month}/${record.year}`;
      } else if (timeFrame === 'Quarterly') {
        const quarter = Math.floor((record.month - 1) / 3) + 1;
        periodKey = `Q${quarter}/${record.year}`;
      } else {
        periodKey = `${record.year}`;
      }
      
      if (!periodGroups[periodKey]) {
        periodGroups[periodKey] = [];
      }
      
      periodGroups[periodKey].push(record);
    });
    
    // Calculate totals for each period
    const periodData = Object.entries(periodGroups).map(([period, records]) => {
      let value;
      
      if (metricKey === 'occupancyRate' || metricKey === 'tenantSatisfaction') {
        // For percentages, take the average
        value = records.reduce((sum, r) => sum + r[fieldName], 0) / records.length;
      } else {
        // For monetary values, sum them
        value = records.reduce((sum, r) => sum + r[fieldName], 0);
      }
      
      return {
        period,
        value,
        recordCount: records.length
      };
    });
    
    // Sort periods chronologically
    periodData.sort((a, b) => {
      if (timeFrame === 'Monthly') {
        const [aMonth, aYear] = a.period.split('/').map(Number);
        const [bMonth, bYear] = b.period.split('/').map(Number);
        return aYear !== bYear ? aYear - bYear : aMonth - bMonth;
      } else if (timeFrame === 'Quarterly') {
        const aQuarter = parseInt(a.period.charAt(1));
        const aYear = parseInt(a.period.substring(3));
        const bQuarter = parseInt(b.period.charAt(1));
        const bYear = parseInt(b.period.substring(3));
        return aYear !== bYear ? aYear - bYear : aQuarter - bQuarter;
      } else {
        return parseInt(a.period) - parseInt(b.period);
      }
    });
    
    setPeriodTotals(periodData);
  };
  
  // Map our front-end metric keys to database field names
  const mapMetricKeyToDbField = (key) => {
    const mapping = {
      'occupancyRate': 'occupancy_rate',
      'grossIncome': 'gross_income',
      'totalExpenses': 'total_expenses',
      'netProfit': 'net_profit',
      'maintenanceCosts': 'maintenance_costs',
      'tenantSatisfaction': 'tenant_satisfaction',
      // For metrics not directly in the database, use defaults
      'rentCollection': 'occupancy_rate', // Use as proxy since we don't have this field
      'propertyValue': 'gross_income', // Use as proxy since we don't have this field
      'yieldRate': 'net_profit' // Use as proxy since we don't have this field
    };
    
    return mapping[key] || 'net_profit'; // Default to net_profit if no mapping
  };

  // Handle time frame selection
  const handleTimeFrameSelect = (period) => {
    setTimeFrame(period);
    setIsLoading(true);
    // In a real app, you would fetch data for the selected time period
  };

  // Format values based on the metric type
  const formatValue = (value) => {
    if (!value && value !== 0) return '0';
    
    // Handle percentage values with max 1 decimal place
    if (typeof value === 'string' && value.includes('%')) {
      const numValue = parseFloat(value.replace('%', ''));
      return `${numValue.toFixed(1)}%`;
    } else if (typeof value === 'number' && 
              (metricKey === 'occupancyRate' || 
               metricKey === 'tenantSatisfaction' || 
               metricKey === 'rentCollection' || 
               metricKey === 'yieldRate')) {
      return `${parseFloat(value).toFixed(1)}%`;
    } else if (typeof value === 'number' && 
              (metricKey === 'grossIncome' || 
               metricKey === 'totalExpenses' || 
               metricKey === 'netProfit' || 
               metricKey === 'maintenanceCosts')) {
      return `£${Math.round(value).toLocaleString()}`;
    } else if (typeof value === 'number' && metricKey === 'propertyValue') {
      return `£${Math.round(value).toLocaleString()}`;
    }
    
    // Use the metric's format function if available
    if (typeof metricInfo.format === 'function') {
      const formattedValue = metricInfo.format(value);
      
      // Additional formatting for percentage values
      if (typeof formattedValue === 'string' && formattedValue.includes('%')) {
        const numValue = parseFloat(formattedValue.replace('%', ''));
        return `${numValue.toFixed(1)}%`;
      }
      
      // Additional formatting for currency values
      if (typeof formattedValue === 'string' && formattedValue.includes('£')) {
        const numValue = parseFloat(formattedValue.replace('£', ''));
        return `£${Math.round(numValue).toLocaleString()}`;
      }
      
      return formattedValue;
    }
    
    return value;
  };

  // Format change values to have at most 1 decimal place
  const formatChangeValue = (change) => {
    if (!change) return '0%';
    
    if (typeof change === 'string' && (change.includes('+') || change.includes('-'))) {
      const numValue = parseFloat(change.replace('+', '').replace('-', '').replace('%', ''));
      const sign = change.startsWith('-') ? '-' : '+';
      return `${sign}${numValue.toFixed(1)}%`;
    }
    
    return change;
  };

  // Handle back navigation
  const handleGoBack = () => {
    router.push("/(landlord_tabs)/insights");
  };

  // Render property card for horizontal scroll
  const renderPropertyCard = ({ item }) => (
    <View style={styles.propertyCard}>
      <View style={styles.propertyHeader}>
        <Text style={styles.propertyName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.changeContainer}>
          <Ionicons 
            name={item.change.startsWith('-') ? 'arrow-down-outline' : 'arrow-up-outline'} 
            size={14} 
            color={item.change.startsWith('-') ? '#F44336' : '#4CAF50'} 
          />
          <Text style={[
            styles.propertyChange,
            { color: item.change.startsWith('-') ? '#F44336' : '#4CAF50' }
          ]}>{formatChangeValue(item.change)}</Text>
        </View>
      </View>
      <Text style={styles.propertyValue}>{formatValue(item.value)}</Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{metricInfo.title}</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading metric data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{metricInfo.title}</Text>
        <View style={styles.headerRight} />
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Metric Header */}
        <LinearGradient
          colors={metricInfo.gradient}
          style={styles.metricHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.metricHeaderContent}>
            <View style={styles.metricIconContainer}>
              <Ionicons name={metricInfo.icon} size={32} color={metricInfo.color} />
            </View>
            <View style={styles.metricHeaderText}>
              <Text style={styles.metricTitle}>{metricInfo.title}</Text>
              <Text style={styles.metricDescription}>{metricInfo.description}</Text>
            </View>
          </View>
          
          {/* Current Value Card */}
          <View style={styles.currentValueCard}>
            <View style={styles.currentValueContent}>
              <Text style={styles.currentValueLabel}>Current Value</Text>
              <Text style={styles.currentValue}>
                {formatValue(overviewMetrics?.[metricKey]?.value || propertyComparison[0]?.value)}
              </Text>
            </View>
          </View>
        </LinearGradient>
        
        {/* Time Frame Selection */}
        <View style={styles.timeFrameContainer}>
          {['Monthly', 'Quarterly', 'Annual'].map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.timeFrameButton,
                timeFrame === period && styles.activeTimeFrameButton
              ]}
              onPress={() => handleTimeFrameSelect(period)}
            >
              <Text style={[
                styles.timeFrameText,
                timeFrame === period && styles.activeTimeFrameText
              ]}>{period}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Overall Summary Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Overall Summary</Text>
          
          {isLoading ? (
            <ActivityIndicator size="large" color={metricInfo.color} />
          ) : Object.keys(totalMetrics).length === 0 ? (
            <Text style={styles.noDataText}>No data available for this time period.</Text>
          ) : (
            <View style={styles.summaryContainer}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Total {metricInfo.title}</Text>
                <Text style={styles.summaryValue}>{formatValue(totalMetrics.total)}</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryItemLabel}>Average</Text>
                  <Text style={styles.summaryItemValue}>{formatValue(totalMetrics.avg)}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryItemLabel}>Minimum</Text>
                  <Text style={styles.summaryItemValue}>{formatValue(totalMetrics.min)}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryItemLabel}>Maximum</Text>
                  <Text style={styles.summaryItemValue}>{formatValue(totalMetrics.max)}</Text>
                </View>
              </View>
            </View>
          )}
        </View>
        
        {/* Period Breakdown Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{timeFrame} Breakdown</Text>
          
          {isLoading ? (
            <ActivityIndicator size="large" color={metricInfo.color} />
          ) : periodTotals.length === 0 ? (
            <Text style={styles.noDataText}>No data available for this time period.</Text>
          ) : (
            <View style={styles.periodBreakdownContainer}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderText}>Period</Text>
                <Text style={styles.tableHeaderText}>{metricInfo.title}</Text>
              </View>
              {periodTotals.map((item, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{item.period}</Text>
                  <Text style={styles.tableCellValue}>{formatValue(item.value)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Property Breakdown Table */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Property Breakdown</Text>
          
          {/* Chart placeholder */}
          <View style={styles.chartContainer}>
            {isLoading ? (
              <ActivityIndicator size="large" color={metricInfo.color} />
            ) : analyticsData.length === 0 ? (
              <Text style={styles.noDataText}>No data available for this time period.</Text>
            ) : (
              <View style={styles.analyticsTable}>
                <View style={styles.tableHeader}>
                  <Text style={styles.tableHeaderText}>Date</Text>
                  <Text style={styles.tableHeaderText}>Property</Text>
                  <Text style={styles.tableHeaderText}>{metricInfo.title}</Text>
                </View>
                {analyticsData.map((item, index) => (
                  <View key={index} style={styles.tableRow}>
                    <Text style={styles.tableCell}>
                      {new Date(item.record_date).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </Text>
                    <Text style={styles.tableCell}>{item.property_name}</Text>
                    <Text style={styles.tableCellValue}>
                      {formatValue(item[mapMetricKeyToDbField(metricKey)])}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Property Comparison Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Property Summary</Text>
          
          {isLoading ? (
            <ActivityIndicator size="large" color={metricInfo.color} />
          ) : propertyComparison.length === 0 ? (
            <Text style={styles.noDataText}>No data available for this time period.</Text>
          ) : (
            <View style={styles.propertyCardsContainer}>
              <FlatList
                data={propertyComparison}
                renderItem={renderPropertyCard}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.propertyCardsList}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
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
    paddingBottom: 80,
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
  headerRight: {
    width: 40,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  metricHeader: {
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  metricHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  metricIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  metricHeaderText: {
    flex: 1,
  },
  metricTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  metricDescription: {
    fontSize: 14,
    color: '#666',
  },
  currentValueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  currentValueContent: {
    flex: 1,
  },
  currentValueLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  currentValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  timeFrameContainer: {
    flexDirection: 'row',
    margin: 16,
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
  chartContainer: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dateRangeText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  simpleChart: {
    marginTop: 16,
  },
  chartBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  barLabelContainer: {
    width: 40,
    alignItems: 'center',
  },
  barLabel: {
    fontSize: 12,
    color: '#666',
  },
  barContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 30,
  },
  bar: {
    height: 20,
    borderRadius: 10,
  },
  barValue: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  sectionContainer: {
    margin: 16,
    marginTop: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  propertyComparisonList: {
    paddingRight: 8,
  },
  propertyCard: {
    width: width * 0.7,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
  },
  propertyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  propertyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  propertyChange: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 2,
  },
  propertyAddress: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  propertyValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
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
}); 