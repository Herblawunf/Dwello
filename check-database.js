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

async function checkDatabase() {
  console.log('🔍 Checking database tables...');
  
  try {
    // Check properties table
    console.log('\n📋 Properties:');
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('*');
    
    if (propertiesError) {
      console.error('Error fetching properties:', propertiesError);
    } else {
      console.log(`Found ${properties.length} properties:`);
      properties.forEach(property => {
        console.log(`  - ${property.name} (${property.id}): ${property.address}, £${property.rent}`);
      });
    }

    // Check monthly_metrics table
    console.log('\n📊 Monthly Metrics:');
    const { data: metrics, error: metricsError } = await supabase
      .from('monthly_metrics')
      .select('*')
      .limit(10);
    
    if (metricsError) {
      console.error('Error fetching metrics:', metricsError);
    } else {
      console.log(`Found ${metrics.length} metrics (showing first 10):`);
      metrics.slice(0, 5).forEach(metric => {
        console.log(`  - ${metric.metric_type}: ${metric.value} (${metric.period}, ${metric.date})`);
      });
    }

    // Check maintenance_tasks table
    console.log('\n🔧 Maintenance Tasks:');
    const { data: tasks, error: tasksError } = await supabase
      .from('maintenance_tasks')
      .select('*');
    
    if (tasksError) {
      console.error('Error fetching maintenance tasks:', tasksError);
    } else {
      console.log(`Found ${tasks.length} maintenance tasks:`);
      tasks.forEach(task => {
        console.log(`  - ${task.category}: £${task.amount} (${task.date})`);
      });
    }

    // Check income_expenses table
    console.log('\n💰 Income & Expenses:');
    const { data: incomeExpenses, error: incomeExpensesError } = await supabase
      .from('income_expenses')
      .select('*');
    
    if (incomeExpensesError) {
      console.error('Error fetching income & expenses:', incomeExpensesError);
    } else {
      console.log(`Found ${incomeExpenses.length} income & expense records:`);
      incomeExpenses.forEach(record => {
        console.log(`  - ${record.date}: Income £${record.gross_income}, Expenses £${record.total_expenses}`);
      });
    }
    
    console.log('\n✅ Database check completed!');
  } catch (error) {
    console.error('❌ Error checking database:', error);
  }
}

// Execute the function
checkDatabase(); 