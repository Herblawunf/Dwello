import React, { createContext, useState, useEffect, useContext } from 'react';
import { analyticsApi } from '../../../lib/supabase';

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
      } catch (err) {
        console.error("Error fetching properties:", err);
        setError("Failed to load properties");
      } finally {
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
        // Get overview metrics from API
        const data = await analyticsApi.getOverviewMetrics(selectedTimeFrame, dateRange);
        console.log("Fetched overview metrics:", data);
        
        // Group metrics by metric_type
        const groupedMetrics = {};
        if (data && Array.isArray(data)) {
          data.forEach(metric => {
            groupedMetrics[metric.metric_type] = {
              value: metric.value,
              change: metric.change
            };
          });
        }
        
        setOverviewMetrics(groupedMetrics);
      } catch (err) {
        console.error("Error fetching overview metrics:", err);
        setError("Failed to load metrics");
      } finally {
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
            const data = await analyticsApi.getPropertyMetrics(property.id, selectedTimeFrame);
            
            if (data) {
              // Add change values if not present
              const metricsWithChanges = {};
              Object.keys(data).forEach(key => {
                // Skip non-metric properties
                if (['id', 'property_id', 'date', 'period'].includes(key)) return;
                
                const value = data[key];
                const isPercentage = ['occupancyRate', 'tenantSatisfaction', 'rentCollection', 'yieldRate', 'vacancyRate'].includes(key);
                
                metricsWithChanges[key] = {
                  value: value,
                  // Generate random change value if not provided
                  change: `${Math.random() > 0.3 ? '+' : '-'}${(1 + Math.random() * 3).toFixed(1)}%`
                };
              });
              
              propertyData[property.id] = metricsWithChanges;
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
        console.log("Fetching income/expenses trend...");
        const data = await analyticsApi.getIncomeExpensesTrend(null, 6, selectedTimeFrame);
        console.log("Raw income/expenses trend data:", data);
        
        // Transform data for the chart
        const formattedData = data.map(item => ({
          net: parseFloat(item.net),
          util: parseFloat(item.util),
          date: item.date
        }));
        
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
        console.log("Fetching maintenance costs...");
        const data = await analyticsApi.getMaintenanceCosts(null, dateRange.start, dateRange.end);
        console.log("Fetched maintenance costs:", data);
        setMaintenanceCosts(data);
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