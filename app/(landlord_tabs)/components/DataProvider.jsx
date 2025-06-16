import React, { createContext, useState, useEffect, useContext } from 'react';
import { analyticsApi } from '../../../lib/supabase';
import { supabase } from '../../../lib/supabase';

// Create context
export const DataContext = createContext();

export function useData() {
  return useContext(DataContext);
}

export default function DataProvider({ children }) {
  // State for all data
  const [properties, setProperties] = useState([]);
  const [overviewMetrics, setOverviewMetrics] = useState({});
  const [propertyMetrics, setPropertyMetrics] = useState({});
  const [maintenanceCosts, setMaintenanceCosts] = useState([]);
  const [incomeExpensesTrend, setIncomeExpensesTrend] = useState([]);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState('Monthly');
  const [loading, setLoading] = useState({
    properties: true,
    metrics: true,
    maintenance: true,
    incomeExpenses: true,
    propertyMetrics: true,
  });
  const [error, setError] = useState(null);

  // Default date range
  const [dateRange, setDateRange] = useState({
    label: 'Jan 2024 - Jun 2024',
    start: '2024-01-01',
    end: '2024-06-30'
  });

  // Fetch properties
  useEffect(() => {
    async function fetchProperties() {
      try {
        const data = await analyticsApi.getProperties();
        console.log("Fetched properties:", data);
        setProperties(data);
        setLoading(prev => ({ ...prev, properties: false }));
      } catch (err) {
        console.error("Error fetching properties:", err);
        setError("Failed to load properties");
        setLoading(prev => ({ ...prev, properties: false }));
      }
    }
    
    fetchProperties();
  }, []);

  // Fetch overview metrics
  useEffect(() => {
    async function fetchOverviewMetrics() {
      setLoading(prev => ({ ...prev, metrics: true }));
      try {
        // Get overview metrics from new analytics system
        const data = await analyticsApi.getPropertyAnalytics(null, selectedTimeFrame);
        console.log("Fetched overview metrics from new system:", data);
        
        // Use the overall metrics directly
        const groupedMetrics = data.overall || {};
        
        setOverviewMetrics(groupedMetrics);
        setLoading(prev => ({ ...prev, metrics: false }));
      } catch (err) {
        console.error("Error fetching overview metrics from new system:", err);
        setError("Failed to load metrics");
        setLoading(prev => ({ ...prev, metrics: false }));
      }
    }
    
    fetchOverviewMetrics();
  }, [dateRange, selectedTimeFrame]);

  // Fetch property-specific metrics
  useEffect(() => {
    async function fetchPropertyMetrics() {
      if (!properties || properties.length === 0) return;
      
      setLoading(prev => ({ ...prev, propertyMetrics: true }));
      
      try {
        const propertyData = {};
        
        // For each property, fetch its metrics
        for (const property of properties) {
          try {
            const data = await analyticsApi.getPropertyAnalytics(property.id, selectedTimeFrame);
            
            if (data) {
              // The data is already in the right format with values and changes
              propertyData[property.id] = data;
            }
          } catch (err) {
            console.error(`Error fetching metrics for property ${property.id}:`, err);
          }
        }
        
        setPropertyMetrics(propertyData);
        setLoading(prev => ({ ...prev, propertyMetrics: false }));
      } catch (err) {
        console.error("Error fetching property metrics:", err);
        setError("Failed to load property metrics");
        setLoading(prev => ({ ...prev, propertyMetrics: false }));
      }
    }
    
    fetchPropertyMetrics();
  }, [properties, selectedTimeFrame, dateRange]);

  // Fetch income and expenses trend
  useEffect(() => {
    async function fetchIncomeExpensesTrend() {
      setLoading(prev => ({ ...prev, incomeExpenses: true }));
      try {
        console.log("Fetching income/expenses trend from analytics...");
        
        // Get the raw analytics data directly to build the trend
        const months = selectedTimeFrame === 'Monthly' ? 6 : 
                      selectedTimeFrame === 'Quarterly' ? 12 : 24;
        
        // Try to query the raw data
        const { data, error } = await supabase
          .from('property_analytics')
          .select('*')
          .order('record_date', { ascending: false })
          .limit(months);
          
        if (error) {
          console.error("Error fetching analytics for trends:", error);
          throw error;
        }
        
        // If we don't have data, set up the analytics system
        if (!data || data.length === 0) {
          await analyticsApi.setupPropertyAnalytics();
        }
        
        // Format the data for the chart
        let formattedData = [];
        if (data && data.length > 0) {
          // Transform analytics data
          if (selectedTimeFrame === 'Annual') {
            // Group by year and aggregate
            const yearGroups = {};
            data.forEach(record => {
              if (!yearGroups[record.year]) {
                yearGroups[record.year] = {
                  net: 0,
                  util: 0,
                  count: 0
                };
              }
              yearGroups[record.year].net += record.net_profit || 0;
              yearGroups[record.year].util += record.total_expenses || 0;
              yearGroups[record.year].count += 1;
            });
            
            formattedData = Object.entries(yearGroups).map(([year, values]) => ({
              net: values.net,
              util: values.util,
              date: year
            }));
          } else if (selectedTimeFrame === 'Quarterly') {
            // Group by quarter and aggregate
            const quarterGroups = {};
            data.forEach(record => {
              const quarter = Math.floor((record.month - 1) / 3) + 1;
              const key = `Q${quarter} ${record.year}`;
              
              if (!quarterGroups[key]) {
                quarterGroups[key] = {
                  net: 0,
                  util: 0,
                  count: 0,
                  year: record.year,
                  quarter: quarter
                };
              }
              quarterGroups[key].net += record.net_profit || 0;
              quarterGroups[key].util += record.total_expenses || 0;
              quarterGroups[key].count += 1;
            });
            
            formattedData = Object.entries(quarterGroups)
              .map(([key, values]) => ({
                net: values.net,
                util: values.util,
                date: key
              }))
              .sort((a, b) => {
                // Sort by date (most recent first)
                const [aQ, aY] = a.date.split(' ');
                const [bQ, bY] = b.date.split(' ');
                if (aY !== bY) return bY - aY;
                return bQ.substring(1) - aQ.substring(1);
              });
          } else {
            // Monthly - use records directly
            formattedData = data.map(record => ({
              net: record.net_profit || 0,
              util: record.total_expenses || 0,
              date: new Date(record.record_date).toLocaleString('default', { month: 'short' })
            }));
          }
        } else {
          // Fallback to sample data
          formattedData = [
            { net: 1000, util: 400, date: 'Jan' },
            { net: 1000, util: 550, date: 'Feb' },
            { net: 900, util: 300, date: 'Mar' },
            { net: 1000, util: 350, date: 'Apr' },
            { net: 700, util: 200, date: 'May' },
            { net: 600, util: 200, date: 'Jun' }
          ];
        }
        
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
  }, [selectedTimeFrame]);

  // Fetch maintenance costs
  useEffect(() => {
    async function fetchMaintenanceCosts() {
      setLoading(prev => ({ ...prev, maintenance: true }));
      try {
        console.log("Fetching maintenance costs from analytics...");
        
        // Query the property_analytics table for maintenance data
        const { data, error } = await supabase
          .from('property_analytics')
          .select('property_name, maintenance_costs')
          .order('record_date', { ascending: false })
          .limit(20);  // Get recent data
          
        if (error) {
          console.error("Error fetching maintenance costs:", error);
          throw error;
        }
        
        if (!data || data.length === 0) {
          // If no data, set up analytics and use sample data
          await analyticsApi.setupPropertyAnalytics();
          setMaintenanceCosts([
            { category: 'Plumbing', amount: 350, percentage: 33 },
            { category: 'Electrical', amount: 220, percentage: 21 },
            { category: 'HVAC', amount: 230, percentage: 21 },
            { category: 'General Repairs', amount: 270, percentage: 25 }
          ]);
        } else {
          // Process the maintenance data from the analytics
          // Group by property and sum maintenance costs
          const propertyMaintenance = {};
          let totalMaintenance = 0;
          
          data.forEach(record => {
            if (!record.property_name) return;
            
            if (!propertyMaintenance[record.property_name]) {
              propertyMaintenance[record.property_name] = 0;
            }
            
            propertyMaintenance[record.property_name] += record.maintenance_costs || 0;
            totalMaintenance += record.maintenance_costs || 0;
          });
          
          // Convert to array format expected by the UI
          const maintenanceData = Object.entries(propertyMaintenance).map(([category, amount]) => ({
            category,
            amount,
            percentage: totalMaintenance > 0 ? Math.round((amount / totalMaintenance) * 100) : 0
          }));
          
          console.log("Processed maintenance costs:", maintenanceData);
          setMaintenanceCosts(maintenanceData);
        }
        setLoading(prev => ({ ...prev, maintenance: false }));
      } catch (err) {
        console.error("Error fetching maintenance costs:", err);
        setError("Failed to load maintenance data");
        setLoading(prev => ({ ...prev, maintenance: false }));
      }
    }
    
    fetchMaintenanceCosts();
  }, [dateRange, selectedTimeFrame]);

  // Value to provide to consumers
  const value = {
    properties,
    overviewMetrics,
    propertyMetrics,
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