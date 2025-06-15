const fs = require('fs');
const path = require('path');

// Create .env file with Supabase credentials
const envContent = `# Supabase configuration
EXPO_PUBLIC_SUPABASE_URL=https://gjfyiqdpysudxfiodvbf.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqZnlpcWRweXN1ZHhmaW9kdmJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1Mzk3MDMsImV4cCI6MjA2NDExNTcwM30.JNfhPx6CZUsuOuDBJ6o-y504VD2CZwt9Ij8oTeK41WE
`;

try {
  fs.writeFileSync(path.join(__dirname, '.env'), envContent);
  console.log('✅ .env file created successfully with Supabase credentials');
} catch (error) {
  console.error('❌ Error creating .env file:', error);
}

// Update app.config.js to use EXPO_PUBLIC_SUPABASE_KEY
try {
  const appConfigPath = path.join(__dirname, 'app.config.js');
  let appConfig = fs.readFileSync(appConfigPath, 'utf8');
  
  // Replace EXPO_PUBLIC_SUPABASE_ANON_KEY with EXPO_PUBLIC_SUPABASE_KEY
  appConfig = appConfig.replace(/EXPO_PUBLIC_SUPABASE_ANON_KEY/g, 'EXPO_PUBLIC_SUPABASE_KEY');
  
  fs.writeFileSync(appConfigPath, appConfig);
  console.log('✅ app.config.js updated to use EXPO_PUBLIC_SUPABASE_KEY');
} catch (error) {
  console.error('❌ Error updating app.config.js:', error);
}

console.log('\n🚀 Setup complete! You can now run your app with Supabase integration.');
console.log('📝 Note: Make sure to run the SQL scripts in your Supabase project to create the necessary tables.'); 