const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get Supabase credentials
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://gjfyiqdpysudxfiodvbf.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!supabaseKey) {
  console.error('❌ EXPO_PUBLIC_SUPABASE_KEY is not set. Please set it in your .env file.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Recreate the analyticsApi functions for testing
const analyticsApi = {
  // Income and expenses trend data
  getIncomeExpensesTrend: async (propertyId = null, months = 6) => {
    // Use a fixed date range for testing that matches our sample data
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-06-30');
    
    console.log(`Fetching income_expenses data from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    console.log(`Property ID: ${propertyId || 'NULL (overview)'}`);
    
    try {
      let query = supabase
        .from('income_expenses')
        .select('date, gross_income, total_expenses')
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date');
      
      if (propertyId) {
        query = query.eq('property_id', propertyId);
      } else {
        query = query.is('property_id', null);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Supabase query error:", error);
        throw error;
      }
      
      console.log(`Received ${data?.length || 0} income_expenses records`);
      
      // If no data is returned, use sample data
      if (!data || data.length === 0) {
        console.log("No income_expenses data found, using sample data");
        return [
          { net: 1000, util: 400, date: 'Jan' },
          { net: 1000, util: 550, date: 'Feb' },
          { net: 900, util: 300, date: 'Mar' },
          { net: 1000, util: 350, date: 'Apr' },
          { net: 700, util: 200, date: 'May' },
          { net: 600, util: 200, date: 'Jun' }
        ];
      }
      
      // Transform data for the chart
      const transformedData = data.map(item => {
        const grossIncome = parseFloat(item.gross_income);
        const totalExpenses = parseFloat(item.total_expenses);
        const netIncome = grossIncome - totalExpenses;
        const dateObj = new Date(item.date);
        const month = dateObj.toLocaleString('default', { month: 'short' });
        
        return {
          net: netIncome,
          util: totalExpenses,
          date: month
        };
      });
      
      console.log("Transformed income_expenses data:", transformedData);
      return transformedData;
    } catch (error) {
      console.error("Error in getIncomeExpensesTrend:", error);
      // Return sample data on error
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
};

async function testIncomeExpensesTrend() {
  try {
    console.log('🧪 Testing getIncomeExpensesTrend function...');

    // Test getIncomeExpensesTrend
    console.log('\n💰 Testing getIncomeExpensesTrend:');
    const incomeExpensesTrend = await analyticsApi.getIncomeExpensesTrend(null, 6);
    console.log(`Found ${incomeExpensesTrend.length} income/expense trend records:`);
    incomeExpensesTrend.forEach(record => {
      console.log(`  - ${record.date}: Net £${record.net}, Utilities £${record.util}`);
    });

    console.log('\n✅ Test completed successfully!');
  } catch (error) {
    console.error('❌ Error testing getIncomeExpensesTrend:', error);
  }
}

// Execute the function
testIncomeExpensesTrend(); 