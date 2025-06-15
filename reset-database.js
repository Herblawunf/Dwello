const fs = require('fs');
const path = require('path');
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

async function resetDatabase() {
  console.log('🔄 Resetting database...');
  
  try {
    // Drop existing tables in reverse order to avoid foreign key constraints
    console.log('Dropping existing tables...');
    await supabase.rpc('drop_tables_if_exist', {
      tables: ['income_expenses', 'maintenance_tasks', 'monthly_metrics', 'properties']
    });
    
    // Read SQL schema file
    const schemaPath = path.join(__dirname, 'lib', 'supabase-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split schema into individual statements
    const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);
    
    // Execute each statement
    console.log('Creating tables and inserting sample data...');
    for (const statement of statements) {
      await supabase.rpc('exec_sql', { sql: statement + ';' });
    }
    
    console.log('✅ Database reset successfully!');
  } catch (error) {
    console.error('❌ Error resetting database:', error);
  }
}

// Execute the function
resetDatabase(); 