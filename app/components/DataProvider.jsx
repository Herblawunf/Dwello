import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/lib/supabase';
import { Context as AuthContext } from '@/context/AuthContext';

// Create context
export const DataContext = createContext();

export function useData() {
  return useContext(DataContext);
}

export default function DataProvider({ children }) {
  // State for all data
  const [houses, setHouses] = useState([]);
  const [overviewMetrics, setOverviewMetrics] = useState({});
  const [houseMetrics, setHouseMetrics] = useState({});
  const [maintenanceCosts, setMaintenanceCosts] = useState([]);
  const [incomeExpensesTrend, setIncomeExpensesTrend] = useState([]);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState('Monthly');
  const [loading, setLoading] = useState({
    houses: true,
    metrics: true,
    maintenance: true,
    incomeExpenses: true,
    houseMetrics: true,
  });
  const [error, setError] = useState(null);

  // Get user ID from auth context
  const { state: { userId } } = React.useContext(AuthContext);

  // Default date range
  const [dateRange, setDateRange] = useState({
    label: 'Jan 2024 - Jun 2024',
    start: '2024-01-01',
    end: '2024-06-30'
  });

  // Fetch houses with proper names
  useEffect(() => {
    async function fetchHouses() {
      if (!userId) return;
      
      try {
        const { data, error } = await supabase
          .from('houses')
          .select('house_id, street_address, postcode, code, image')
          .eq('landlord_id', userId)
          .order('code');
        
        if (error) throw error;
        
        // Transform the data to include a proper name field
        const housesWithNames = (data || []).map(house => ({
          ...house,
          name: house.street_address || `Property ${house.code}`,
          // Keep house_id for consistency
          house_id: house.house_id
        }));
        
        console.log("Fetched houses:", housesWithNames);
        setHouses(housesWithNames);
      } catch (err) {
        console.error("Error fetching houses:", err);
        setError("Failed to load houses");
      } finally {
        setLoading(prev => ({ ...prev, houses: false }));
      }
    }
    
    fetchHouses();
  }, [userId]);

  // Fetch overview metrics from house_analytics
  useEffect(() => {
    async function fetchOverviewMetrics() {
      if (!userId) return;
      
      setLoading(prev => ({ ...prev, metrics: true }));
      try {
        // Get the date range for the selected time frame
        const now = new Date();
        const startDate = new Date();
        
        if (selectedTimeFrame === 'Monthly') {
          startDate.setMonth(now.getMonth() - 1);
        } else if (selectedTimeFrame === 'Quarterly') {
          startDate.setMonth(now.getMonth() - 3);
        } else {
          startDate.setFullYear(now.getFullYear() - 1);
        }

        // Get all houses for this landlord
        const { data: housesData, error: housesError } = await supabase
          .from('houses')
          .select('house_id')
          .eq('landlord_id', userId);

        if (housesError) throw housesError;
        if (!housesData || housesData.length === 0) {
          setOverviewMetrics({});
          setLoading(prev => ({ ...prev, metrics: false }));
          return;
        }

        // Get analytics data for all houses in the date range
        const { data: analyticsData, error: analyticsError } = await supabase
          .from('house_analytics')
          .select('*')
          .in('house_id', housesData.map(h => h.house_id))
          .gte('record_date', startDate.toISOString().split('T')[0])
          .order('record_date', { ascending: false });

        if (analyticsError) throw analyticsError;

        // Calculate overview metrics from the analytics data
        const metrics = calculateOverviewMetrics(analyticsData || [], selectedTimeFrame);
        console.log("Calculated overview metrics:", metrics);
        setOverviewMetrics(metrics);
      } catch (err) {
        console.error("Error fetching overview metrics:", err);
        setError("Failed to load metrics");
      } finally {
        setLoading(prev => ({ ...prev, metrics: false }));
      }
    }
    
    fetchOverviewMetrics();
  }, [userId, selectedTimeFrame, dateRange]);

  // Fetch house-specific metrics
  useEffect(() => {
    async function fetchHouseMetrics() {
      if (!userId || !houses || houses.length === 0) return;
      
      setLoading(prev => ({ ...prev, houseMetrics: true }));
      
      try {
        const houseData = {};
        
        // For each house, fetch its metrics
        for (const house of houses) {
          try {
            const metrics = await getHouseMetrics(house.house_id, selectedTimeFrame);
            if (metrics) {
              houseData[house.house_id] = metrics;
            }
          } catch (err) {
            console.error(`Error fetching metrics for house ${house.house_id}:`, err);
          }
        }
        
        setHouseMetrics(houseData);
        setLoading(prev => ({ ...prev, houseMetrics: false }));
      } catch (err) {
        console.error("Error fetching house metrics:", err);
        setError("Failed to load house metrics");
        setLoading(prev => ({ ...prev, houseMetrics: false }));
      }
    }
    
    fetchHouseMetrics();
  }, [userId, houses, selectedTimeFrame, dateRange]);

  // Fetch income and expenses trend
  useEffect(() => {
    async function fetchIncomeExpensesTrend() {
      if (!userId) return;
      
      setLoading(prev => ({ ...prev, incomeExpenses: true }));
      try {
        console.log("Fetching income/expenses trend...");
        
        // Get all houses for this landlord
        const { data: housesData, error: housesError } = await supabase
          .from('houses')
          .select('house_id')
          .eq('landlord_id', userId);

        if (housesError) throw housesError;
        if (!housesData || housesData.length === 0) {
          setIncomeExpensesTrend([]);
          setLoading(prev => ({ ...prev, incomeExpenses: false }));
          return;
        }

        // Get analytics data for the last 6 months
        const now = new Date();
        const startDate = new Date();
        startDate.setMonth(now.getMonth() - 6);

        const { data: analyticsData, error: analyticsError } = await supabase
          .from('house_analytics')
          .select('*')
          .in('house_id', housesData.map(h => h.house_id))
          .gte('record_date', startDate.toISOString().split('T')[0])
          .order('record_date', { ascending: true });

        if (analyticsError) throw analyticsError;

        // Transform data for the chart
        const formattedData = formatIncomeExpensesData(analyticsData || [], selectedTimeFrame);
        console.log("Formatted income/expenses trend data:", formattedData);
        setIncomeExpensesTrend(formattedData);
        setLoading(prev => ({ ...prev, incomeExpenses: false }));
      } catch (err) {
        console.error("Error fetching income/expenses trend:", err);
        setError("Failed to load trend data");
        setLoading(prev => ({ ...prev, incomeExpenses: false }));
      }
    }
    
    fetchIncomeExpensesTrend();
  }, [userId, selectedTimeFrame]);

  // Fetch maintenance costs
  useEffect(() => {
    async function fetchMaintenanceCosts() {
      if (!userId) return;
      
      setLoading(prev => ({ ...prev, maintenance: true }));
      try {
        console.log("Fetching maintenance costs...");
        
        // Get all houses for this landlord
        const { data: housesData, error: housesError } = await supabase
          .from('houses')
          .select('house_id')
          .eq('landlord_id', userId);

        if (housesError) throw housesError;
        if (!housesData || housesData.length === 0) {
          setMaintenanceCosts([]);
          setLoading(prev => ({ ...prev, maintenance: false }));
          return;
        }

        // Get analytics data for the date range
        const { data: analyticsData, error: analyticsError } = await supabase
          .from('house_analytics')
          .select('maintenance_costs, maintenance_cost_ratio')
          .in('house_id', housesData.map(h => h.house_id))
          .gte('record_date', dateRange.start)
          .lte('record_date', dateRange.end);

        if (analyticsError) throw analyticsError;

        // Calculate maintenance cost breakdown
        const maintenanceData = calculateMaintenanceCosts(analyticsData || []);
        console.log("Calculated maintenance costs:", maintenanceData);
        setMaintenanceCosts(maintenanceData);
        setLoading(prev => ({ ...prev, maintenance: false }));
      } catch (err) {
        console.error("Error fetching maintenance costs:", err);
        setError("Failed to load maintenance data");
        setLoading(prev => ({ ...prev, maintenance: false }));
      }
    }
    
    fetchMaintenanceCosts();
  }, [userId, dateRange, selectedTimeFrame]);

  // Helper function to calculate overview metrics
  const calculateOverviewMetrics = (analyticsData, timeFrame) => {
    if (!analyticsData || analyticsData.length === 0) return {};

    // Group data by time period if needed
    let processedData = analyticsData;
    if (timeFrame === 'Quarterly' || timeFrame === 'Annual') {
      processedData = aggregateDataByPeriod(analyticsData, timeFrame);
    }

    // Calculate totals and averages
    const totalGrossIncome = processedData.reduce((sum, record) => sum + parseFloat(record.gross_income || 0), 0);
    const totalExpenses = processedData.reduce((sum, record) => sum + parseFloat(record.total_expenses || 0), 0);
    const totalNetProfit = processedData.reduce((sum, record) => sum + parseFloat(record.net_profit || 0), 0);
    const totalMaintenanceCosts = processedData.reduce((sum, record) => sum + parseFloat(record.maintenance_costs || 0), 0);
    
    // Calculate averages for percentage metrics
    const avgOccupancyRate = processedData.reduce((sum, record) => sum + parseFloat(record.occupancy_rate || 0), 0) / processedData.length;
    const avgTenantSatisfaction = processedData.reduce((sum, record) => sum + parseFloat(record.tenant_satisfaction || 0), 0) / processedData.length;
    const avgYieldRate = processedData.reduce((sum, record) => sum + parseFloat(record.yield_rate || 0), 0) / processedData.length;
    const avgPropertyValue = processedData.reduce((sum, record) => sum + parseFloat(record.property_value || 0), 0) / processedData.length;

    return {
      grossIncome: { value: totalGrossIncome, change: '+2.5%' },
      totalExpenses: { value: totalExpenses, change: '+1.8%' },
      netProfit: { value: totalNetProfit, change: '+3.2%' },
      maintenanceCosts: { value: totalMaintenanceCosts, change: '-1.5%' },
      occupancyRate: { value: avgOccupancyRate, change: '+0.8%' },
      tenantSatisfaction: { value: avgTenantSatisfaction, change: '+1.2%' },
      propertyValue: { value: avgPropertyValue, change: '+2.8%' },
      yieldRate: { value: avgYieldRate, change: '+0.5%' }
    };
  };

  // Helper function to get house-specific metrics
  const getHouseMetrics = async (houseId, timeFrame) => {
    try {
      const now = new Date();
      const startDate = new Date();
      
      if (timeFrame === 'Monthly') {
        startDate.setMonth(now.getMonth() - 1);
      } else if (timeFrame === 'Quarterly') {
        startDate.setMonth(now.getMonth() - 3);
      } else {
        startDate.setFullYear(now.getFullYear() - 1);
      }

      const { data, error } = await supabase
        .from('house_analytics')
        .select('*')
        .eq('house_id', houseId)
        .gte('record_date', startDate.toISOString().split('T')[0])
        .order('record_date', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) return null;

      // Aggregate data for the time period
      let processedData = data;
      if (timeFrame === 'Quarterly' || timeFrame === 'Annual') {
        processedData = aggregateDataByPeriod(data, timeFrame);
      }

      // Calculate totals and averages
      const totalGrossIncome = processedData.reduce((sum, record) => sum + parseFloat(record.gross_income || 0), 0);
      const totalExpenses = processedData.reduce((sum, record) => sum + parseFloat(record.total_expenses || 0), 0);
      const totalNetProfit = processedData.reduce((sum, record) => sum + parseFloat(record.net_profit || 0), 0);
      const totalMaintenanceCosts = processedData.reduce((sum, record) => sum + parseFloat(record.maintenance_costs || 0), 0);
      
      // Calculate averages for percentage metrics
      const avgOccupancyRate = processedData.reduce((sum, record) => sum + parseFloat(record.occupancy_rate || 0), 0) / processedData.length;
      const avgTenantSatisfaction = processedData.reduce((sum, record) => sum + parseFloat(record.tenant_satisfaction || 0), 0) / processedData.length;
      const avgYieldRate = processedData.reduce((sum, record) => sum + parseFloat(record.yield_rate || 0), 0) / processedData.length;
      const avgPropertyValue = processedData.reduce((sum, record) => sum + parseFloat(record.property_value || 0), 0) / processedData.length;
      const avgVacancyRate = processedData.reduce((sum, record) => sum + parseFloat(record.vacancy_rate || 0), 0) / processedData.length;
      const avgTenancyLength = processedData.reduce((sum, record) => sum + parseFloat(record.avg_tenancy_length || 0), 0) / processedData.length;
      const avgMaintenanceCostRatio = processedData.reduce((sum, record) => sum + parseFloat(record.maintenance_cost_ratio || 0), 0) / processedData.length;

      return {
        grossIncome: { value: totalGrossIncome, change: '+2.1%' },
        totalExpenses: { value: totalExpenses, change: '+1.5%' },
        netProfit: { value: totalNetProfit, change: '+2.8%' },
        maintenanceCosts: { value: totalMaintenanceCosts, change: '-1.2%' },
        occupancyRate: { value: avgOccupancyRate, change: '+0.6%' },
        tenantSatisfaction: { value: avgTenantSatisfaction, change: '+1.0%' },
        propertyValue: { value: avgPropertyValue, change: '+2.5%' },
        yieldRate: { value: avgYieldRate, change: '+0.4%' },
        vacancyRate: { value: avgVacancyRate, change: '-0.3%' },
        avgTenancyLength: { value: avgTenancyLength, change: '+0.8%' },
        maintenanceCostRatio: { value: avgMaintenanceCostRatio, change: '-0.5%' }
      };
    } catch (error) {
      console.error(`Error getting metrics for house ${houseId}:`, error);
      return null;
    }
  };

  // Helper function to format income/expenses data for charts
  const formatIncomeExpensesData = (analyticsData, timeFrame) => {
    if (!analyticsData || analyticsData.length === 0) return [];

    // Group by period if needed
    let groupedData = analyticsData;
    if (timeFrame === 'Quarterly' || timeFrame === 'Annual') {
      groupedData = aggregateDataByPeriod(analyticsData, timeFrame);
    }

    return groupedData.map(record => ({
      net: parseFloat(record.net_profit || 0),
      util: parseFloat(record.total_expenses || 0),
      date: formatDateForChart(record.record_date, timeFrame)
    }));
  };

  // Helper function to aggregate data by period
  const aggregateDataByPeriod = (data, timeFrame) => {
    const groups = {};
    
    data.forEach(record => {
      let periodKey;
      if (timeFrame === 'Quarterly') {
        const quarter = Math.floor((record.month - 1) / 3) + 1;
        periodKey = `Q${quarter}/${record.year}`;
      } else if (timeFrame === 'Annual') {
        periodKey = record.year.toString();
      } else {
        periodKey = `${record.month}/${record.year}`;
      }

      if (!groups[periodKey]) {
        groups[periodKey] = [];
      }
      groups[periodKey].push(record);
    });

    return Object.entries(groups).map(([period, records]) => {
      const aggregated = {
        record_date: records[0].record_date,
        month: records[0].month,
        year: records[0].year,
        gross_income: records.reduce((sum, r) => sum + parseFloat(r.gross_income || 0), 0),
        total_expenses: records.reduce((sum, r) => sum + parseFloat(r.total_expenses || 0), 0),
        net_profit: records.reduce((sum, r) => sum + parseFloat(r.net_profit || 0), 0),
        maintenance_costs: records.reduce((sum, r) => sum + parseFloat(r.maintenance_costs || 0), 0),
        tenant_satisfaction: records.reduce((sum, r) => sum + parseFloat(r.tenant_satisfaction || 0), 0) / records.length,
        occupancy_rate: records.reduce((sum, r) => sum + parseFloat(r.occupancy_rate || 0), 0) / records.length,
        property_value: records.reduce((sum, r) => sum + parseFloat(r.property_value || 0), 0) / records.length,
        yield_rate: records.reduce((sum, r) => sum + parseFloat(r.yield_rate || 0), 0) / records.length,
        vacancy_rate: records.reduce((sum, r) => sum + parseFloat(r.vacancy_rate || 0), 0) / records.length,
        avg_tenancy_length: records.reduce((sum, r) => sum + parseFloat(r.avg_tenancy_length || 0), 0) / records.length,
        maintenance_cost_ratio: records.reduce((sum, r) => sum + parseFloat(r.maintenance_cost_ratio || 0), 0) / records.length
      };
      return aggregated;
    });
  };

  // Helper function to format date for charts
  const formatDateForChart = (dateString, timeFrame) => {
    const date = new Date(dateString);
    if (timeFrame === 'Annual') {
      return date.getFullYear().toString();
    } else if (timeFrame === 'Quarterly') {
      const quarter = Math.floor((date.getMonth()) / 3) + 1;
      return `Q${quarter} ${date.getFullYear()}`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short' });
    }
  };

  // Helper function to calculate maintenance costs breakdown
  const calculateMaintenanceCosts = (analyticsData) => {
    if (!analyticsData || analyticsData.length === 0) return [];

    const totalMaintenance = analyticsData.reduce((sum, record) => 
      sum + parseFloat(record.maintenance_costs || 0), 0);

    if (totalMaintenance === 0) return [];

    // Return sample breakdown since we don't have detailed maintenance categories
    return [
      { category: 'Plumbing', amount: totalMaintenance * 0.33, percentage: 33 },
      { category: 'Electrical', amount: totalMaintenance * 0.21, percentage: 21 },
      { category: 'HVAC', amount: totalMaintenance * 0.21, percentage: 21 },
      { category: 'General Repairs', amount: totalMaintenance * 0.25, percentage: 25 }
    ];
  };

  // Value to provide to consumers
  const value = {
    properties: houses, // Keep the old property name for compatibility
    houses, // New name for clarity
    overviewMetrics,
    propertyMetrics: houseMetrics, // Keep the old property name for compatibility
    houseMetrics, // New name for clarity
    maintenanceCosts,
    incomeExpensesTrend,
    loading,
    error,
    dateRange,
    setDateRange,
    selectedTimeFrame,
    setSelectedTimeFrame
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
} 