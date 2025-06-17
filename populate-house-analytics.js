const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Sample landlord ID (you'll need to replace this with a real user ID)
const SAMPLE_LANDLORD_ID = '123e4567-e89b-12d3-a456-426614174000';

async function populateTables() {
  try {
    console.log('Starting to populate tables...');

    // First, create sample houses
    console.log('Creating sample houses...');
    const housesData = [
      {
        landlord_id: SAMPLE_LANDLORD_ID,
        street_address: '123 Bridgewater Road',
        postcode: 'SW1A 1AA',
        image: null
      },
      {
        landlord_id: SAMPLE_LANDLORD_ID,
        street_address: '45 Oak Avenue',
        postcode: 'M1 1AA',
        image: null
      },
      {
        landlord_id: SAMPLE_LANDLORD_ID,
        street_address: '78 Maple Street',
        postcode: 'B1 1AA',
        image: null
      }
    ];

    const { data: houses, error: housesError } = await supabase
      .from('houses')
      .insert(housesData)
      .select();

    if (housesError) {
      console.error('Error creating houses:', housesError);
      return;
    }

    console.log('Created houses:', houses);

    // Now create sample analytics data for each house
    console.log('Creating sample analytics data...');
    const analyticsData = [];

    houses.forEach(house => {
      // Generate 6 months of data for each house
      for (let i = 0; i < 6; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        
        // Generate realistic but varied data
        const baseIncome = 1200 + (Math.random() * 400);
        const baseExpenses = 500 + (Math.random() * 200);
        const netProfit = baseIncome - baseExpenses;
        const maintenanceCosts = 200 + (Math.random() * 150);
        
        analyticsData.push({
          house_id: house.house_id,
          house_name: house.street_address,
          record_date: date.toISOString().split('T')[0],
          month: month,
          year: year,
          gross_income: baseIncome,
          total_expenses: baseExpenses,
          net_profit: netProfit,
          maintenance_costs: maintenanceCosts,
          tenant_satisfaction: 85 + (Math.random() * 10),
          occupancy_rate: 90 + (Math.random() * 8),
          property_value: 350000 + (Math.random() * 50000),
          yield_rate: 5 + (Math.random() * 2),
          vacancy_rate: 5 + (Math.random() * 3),
          avg_tenancy_length: 18 + (Math.random() * 6),
          maintenance_cost_ratio: 15 + (Math.random() * 5),
          rent_to_value_ratio: 4 + (Math.random() * 1)
        });
      }
    });

    const { data: analytics, error: analyticsError } = await supabase
      .from('house_analytics')
      .insert(analyticsData)
      .select();

    if (analyticsError) {
      console.error('Error creating analytics data:', analyticsError);
      return;
    }

    console.log('Created analytics records:', analytics.length);
    console.log('Sample analytics record:', analytics[0]);

    console.log('✅ Successfully populated tables!');
    console.log(`Created ${houses.length} houses and ${analytics.length} analytics records`);

  } catch (error) {
    console.error('Error populating tables:', error);
  }
}

// Run the population script
populateTables(); 