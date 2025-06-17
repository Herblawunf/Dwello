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
      // Insert analytics data for each house
      for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
        const date = new Date();
        date.setMonth(date.getMonth() - monthOffset);
        
        const month = date.getMonth() + 1; // 1-12
        const year = date.getFullYear();
        const recordDate = date.toISOString().split('T')[0];
        
        // Generate realistic data with some variation
        const baseIncome = 1200 + (Math.random() * 300); // Different base income per house
        const baseExpenses = 400 + (Math.random() * 100);
        const maintenanceCosts = 150 + (Math.random() * 200);
        const tenantSatisfaction = 85 + (Math.random() * 15);
        const occupancyRate = 90 + (Math.random() * 10);
        const propertyValue = 350000 + (Math.random() * 50000) + (Math.random() * 100000);
        const yieldRate = 4.5 + (Math.random() * 3);
        const vacancyRate = 5 + (Math.random() * 5);
        const avgTenancyLength = 18 + (Math.random() * 12);
        const maintenanceCostRatio = (maintenanceCosts / baseIncome) * 100;
        const rentToValueRatio = (baseIncome * 12 / propertyValue) * 100;
        
        const analyticsRecord = {
          house_id: house.house_id,
          record_date: recordDate,
          month: month,
          year: year,
          gross_income: baseIncome + (Math.random() * 200 - 100),
          total_expenses: baseExpenses + (Math.random() * 100 - 50),
          net_profit: baseIncome - baseExpenses + (Math.random() * 150 - 75),
          maintenance_costs: maintenanceCosts + (Math.random() * 50 - 25),
          tenant_satisfaction: tenantSatisfaction,
          occupancy_rate: occupancyRate,
          property_value: propertyValue,
          yield_rate: yieldRate,
          vacancy_rate: vacancyRate,
          avg_tenancy_length: avgTenancyLength,
          maintenance_cost_ratio: maintenanceCostRatio,
          rent_to_value_ratio: rentToValueRatio
        };
        
        const { error: analyticsError } = await supabase
          .from('house_analytics')
          .insert(analyticsRecord);
        
        if (analyticsError) {
          console.error(`Error inserting analytics for house ${house.house_id}:`, analyticsError);
        } else {
          console.log(`✅ Inserted analytics for ${house.street_address} - ${recordDate}`);
        }
      }
    });

    console.log('✅ Successfully populated tables!');
    console.log(`Created ${houses.length} houses and analytics records for each house`);

  } catch (error) {
    console.error('Error populating tables:', error);
  }
}

// Run the population script
populateTables(); 