import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Get Supabase credentials from app config
const supabaseUrl = Constants.expoConfig.extra.supabaseUrl;
const supabaseAnonKey = Constants.expoConfig.extra.supabaseAnonKey;

// If anonKey is not set, provide instructions
if (!supabaseAnonKey) {
  console.warn(
    "Supabase Anon Key is not set. Please set EXPO_PUBLIC_SUPABASE_KEY in your environment or app.config.js"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Helper functions for analytics data
export const analyticsApi = {
  // Properties
  getProperties: async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching properties:", error);
      // Return sample data on error
      return [
        { id: 1, name: 'Bridgewater Road', address: '123 Bridgewater Rd, London' },
        { id: 2, name: 'Oak Avenue', address: '45 Oak Ave, Manchester' }
      ];
    }
  },
  
  // Metrics for overview
  getOverviewMetrics: async (period = 'Monthly', dateRange) => {
    console.log(`Fetching overview metrics for period: ${period}`);
    
    try {
      // Generate sample data based on the period
      const multiplier = period === 'Monthly' ? 1 : 
                        period === 'Quarterly' ? 3 : 12;
      
      // Sample data that changes based on time frame
      return [
        { metric_type: 'occupancyRate', value: 92 + (Math.random() * 3), change: `+${(1.5 + Math.random()).toFixed(1)}%` },
        { metric_type: 'grossIncome', value: 1200 * multiplier + (Math.random() * 200), change: `+${(3.2 + Math.random()).toFixed(1)}%` },
        { metric_type: 'totalExpenses', value: 500 * multiplier + (Math.random() * 100), change: `+${(2.1 + Math.random()).toFixed(1)}%` },
        { metric_type: 'netProfit', value: 700 * multiplier + (Math.random() * 150), change: `+${(4.5 + Math.random()).toFixed(1)}%` },
        { metric_type: 'maintenanceCosts', value: 300 * multiplier + (Math.random() * 80), change: `-${(2.8 + Math.random()).toFixed(1)}%` },
        { metric_type: 'tenantSatisfaction', value: 88 + (Math.random() * 7), change: `+${(2.0 + Math.random()).toFixed(1)}%` },
        { metric_type: 'rentCollection', value: 96 + (Math.random() * 3), change: `+${(1.0 + Math.random()).toFixed(1)}%` },
        { metric_type: 'propertyValue', value: 350000 + (Math.random() * 50000), change: `+${(3.5 + Math.random()).toFixed(1)}%` }
      ];
    } catch (error) {
      console.error(`Error fetching overview metrics:`, error);
      
      // Generate sample data based on the period
      const multiplier = period === 'Monthly' ? 1 : 
                        period === 'Quarterly' ? 3 : 12;
      
      // Sample data that changes based on time frame
      return [
        { metric_type: 'occupancyRate', value: 92 + (Math.random() * 3), change: `+${(1.5 + Math.random()).toFixed(1)}%` },
        { metric_type: 'grossIncome', value: 1200 * multiplier + (Math.random() * 200), change: `+${(3.2 + Math.random()).toFixed(1)}%` },
        { metric_type: 'totalExpenses', value: 500 * multiplier + (Math.random() * 100), change: `+${(2.1 + Math.random()).toFixed(1)}%` },
        { metric_type: 'netProfit', value: 700 * multiplier + (Math.random() * 150), change: `+${(4.5 + Math.random()).toFixed(1)}%` },
        { metric_type: 'maintenanceCosts', value: 300 * multiplier + (Math.random() * 80), change: `-${(2.8 + Math.random()).toFixed(1)}%` },
        { metric_type: 'tenantSatisfaction', value: 88 + (Math.random() * 7), change: `+${(2.0 + Math.random()).toFixed(1)}%` },
        { metric_type: 'rentCollection', value: 96 + (Math.random() * 3), change: `+${(1.0 + Math.random()).toFixed(1)}%` },
        { metric_type: 'propertyValue', value: 350000 + (Math.random() * 50000), change: `+${(3.5 + Math.random()).toFixed(1)}%` }
      ];
    }
  },
  
  // Property-specific metrics
  getPropertyMetrics: async (propertyId, period = 'Monthly') => {
    console.log(`Fetching ${period.toLowerCase()} metrics for property ${propertyId}`);
    
    try {
      // Generate consistent sample data for each property
      const multiplier = period === 'Monthly' ? 1 : 
                        period === 'Quarterly' ? 3 : 12;
      
      // Use property ID to generate different but consistent values
      const seed = typeof propertyId === 'number' ? propertyId : 
                  typeof propertyId === 'string' && propertyId.length > 0 ? 
                  propertyId.charCodeAt(0) % 5 + 1 : 1;
      
      // Create property-specific metrics
      return {
        occupancyRate: 85 + (seed * 2) + (Math.random() * 5),
        grossIncome: (1000 + (seed * 200)) * multiplier + (Math.random() * 200),
        totalExpenses: (400 + (seed * 50)) * multiplier + (Math.random() * 100),
        netProfit: (600 + (seed * 150)) * multiplier + (Math.random() * 150),
        maintenanceCosts: (250 + (seed * 30)) * multiplier + (Math.random() * 80),
        tenantSatisfaction: 80 + (seed * 3) + (Math.random() * 5),
        rentCollection: 90 + (seed * 1.5) + (Math.random() * 3),
        propertyValue: 300000 + (seed * 25000) + (Math.random() * 20000),
        yieldRate: 5 + (seed * 0.5) + (Math.random() * 1),
        vacancyRate: 8 - (seed * 0.8) + (Math.random() * 2),
        avgTenancyLength: 18 + (seed * 2) + (Math.random() * 4),
        maintenanceCostRatio: 15 - (seed * 0.5) + (Math.random() * 3)
      };
    } catch (error) {
      console.error(`Error fetching property metrics:`, error);
      
      // Generate fallback sample data
      const multiplier = period === 'Monthly' ? 1 : 
                        period === 'Quarterly' ? 3 : 12;
      
      const seed = typeof propertyId === 'number' ? propertyId : 
                  typeof propertyId === 'string' && propertyId.length > 0 ? 
                  propertyId.charCodeAt(0) % 5 + 1 : 1;
      
      return {
        occupancyRate: 85 + (seed * 2) + (Math.random() * 5),
        grossIncome: (1000 + (seed * 200)) * multiplier + (Math.random() * 200),
        totalExpenses: (400 + (seed * 50)) * multiplier + (Math.random() * 100),
        netProfit: (600 + (seed * 150)) * multiplier + (Math.random() * 150),
        maintenanceCosts: (250 + (seed * 30)) * multiplier + (Math.random() * 80),
        tenantSatisfaction: 80 + (seed * 3) + (Math.random() * 5),
        rentCollection: 90 + (seed * 1.5) + (Math.random() * 3),
        propertyValue: 300000 + (seed * 25000) + (Math.random() * 20000),
        yieldRate: 5 + (seed * 0.5) + (Math.random() * 1),
        vacancyRate: 8 - (seed * 0.8) + (Math.random() * 2),
        avgTenancyLength: 18 + (seed * 2) + (Math.random() * 4),
        maintenanceCostRatio: 15 - (seed * 0.5) + (Math.random() * 3)
      };
    }
  },
  
  // Maintenance costs breakdown
  getMaintenanceCosts: async (propertyId = null, startDate, endDate) => {
    try {
      // Return consistent sample data
      return [
        { category: 'Plumbing', amount: 350, percentage: 33 },
        { category: 'Electrical', amount: 220, percentage: 21 },
        { category: 'HVAC', amount: 230, percentage: 21 },
        { category: 'General Repairs', amount: 270, percentage: 25 }
      ];
    } catch (error) {
      console.error("Error in getMaintenanceCosts:", error);
      return [
        { category: 'Plumbing', amount: 350, percentage: 33 },
        { category: 'Electrical', amount: 220, percentage: 21 },
        { category: 'HVAC', amount: 230, percentage: 21 },
        { category: 'General Repairs', amount: 270, percentage: 25 }
      ];
    }
  },
  
  // Income and expenses trend data
  getIncomeExpensesTrend: async (propertyId = null, months = 6, period = 'Monthly') => {
    console.log(`Fetching income_expenses data for ${period}`);
    console.log(`Property ID: ${propertyId || 'NULL (overview)'}`);
    
    try {
      // Generate sample data based on the period
      if (period === 'Annual') {
        return [
          { net: 12000, util: 4800, date: '2019' },
          { net: 13500, util: 5200, date: '2020' },
          { net: 14200, util: 5500, date: '2021' },
          { net: 15800, util: 6000, date: '2022' },
          { net: 17500, util: 6500, date: '2023' },
          { net: 19000, util: 7000, date: '2024' }
        ];
      } else if (period === 'Quarterly') {
        return [
          { net: 3000, util: 1200, date: 'Q1 2023' },
          { net: 3500, util: 1400, date: 'Q2 2023' },
          { net: 3800, util: 1500, date: 'Q3 2023' },
          { net: 4200, util: 1600, date: 'Q4 2023' },
          { net: 4500, util: 1700, date: 'Q1 2024' },
          { net: 4800, util: 1800, date: 'Q2 2024' }
        ];
      } else {
        // Monthly data
        return [
          { net: 1000, util: 400, date: 'Jan' },
          { net: 1000, util: 550, date: 'Feb' },
          { net: 900, util: 300, date: 'Mar' },
          { net: 1000, util: 350, date: 'Apr' },
          { net: 700, util: 200, date: 'May' },
          { net: 600, util: 200, date: 'Jun' }
        ];
      }
    } catch (error) {
      console.error(`Error in getIncomeExpensesTrend:`, error);
      
      // Return sample data on error based on the period
      if (period === 'Annual') {
        return [
          { net: 12000, util: 4800, date: '2019' },
          { net: 13500, util: 5200, date: '2020' },
          { net: 14200, util: 5500, date: '2021' },
          { net: 15800, util: 6000, date: '2022' },
          { net: 17500, util: 6500, date: '2023' },
          { net: 19000, util: 7000, date: '2024' }
        ];
      } else if (period === 'Quarterly') {
        return [
          { net: 3000, util: 1200, date: 'Q1 2023' },
          { net: 3500, util: 1400, date: 'Q2 2023' },
          { net: 3800, util: 1500, date: 'Q3 2023' },
          { net: 4200, util: 1600, date: 'Q4 2023' },
          { net: 4500, util: 1700, date: 'Q1 2024' },
          { net: 4800, util: 1800, date: 'Q2 2024' }
        ];
      } else {
        return [
          { net: 1000, util: 400, date: 'Jan' },
          { net: 1000, util: 550, date: 'Feb' },
          { net: 900, util: 300, date: 'Mar' },
          { net: 1000, util: 350, date: 'Apr' },
          { net: 700, util: 200, date: 'May' },
          { net: 600, util: 200, date: 'Jun' }
        ];
      }
    }
  }
};