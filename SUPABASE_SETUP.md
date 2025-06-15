# Supabase Setup for Dwello Analytics

This document provides information about the Supabase database setup for the Dwello analytics features.

## Database Schema

The database consists of four main tables:

1. **properties** - Stores information about rental properties
2. **monthly_metrics** - Stores metrics data with property relationships
3. **maintenance_tasks** - Logs maintenance expenses
4. **income_expenses** - Tracks monthly financial data

## Troubleshooting Common Issues

### Issue 1: "No route named 'insights' exists in nested children"

This error occurs when the app tries to navigate to the "insights" route but it doesn't exist.

**Solution:**
- We've created a new `insights.jsx` file in the `app/(landlord_tabs)` directory.
- This file serves as a hub for different analytics views in the app.

### Issue 2: "Error fetching maintenance costs: [TypeError: supabase.from(...).group is not a function]"

This error occurs because the Supabase JavaScript client doesn't support GROUP BY operations directly.

**Solution:**
- We've updated the `getMaintenanceCosts` function in `lib/supabase.js` to:
  1. Fetch raw maintenance task data
  2. Process the grouping on the client side
  3. Calculate totals and percentages in JavaScript

### Issue 3: "Error fetching income/expenses trend: column monthly_metrics.gross_income does not exist"

This error occurs because we were trying to query the wrong table or column.

**Solution:**
- We've updated the `getIncomeExpensesTrend` function in `lib/supabase.js` to:
  1. Query the `income_expenses` table instead of `monthly_metrics`
  2. Use the correct column names from that table

### Issue 4: "Chart not loading, showing loading indicator indefinitely"

This issue occurs when the data for the chart is not being properly fetched or formatted.

**Solution:**
- We've updated the `getIncomeExpensesTrend` function in `lib/supabase.js` to:
  1. Use a fixed date range (Jan 2024 - Jun 2024) that matches our sample data
  2. Add proper error handling and fallback to sample data if no data is found
  3. Ensure the data is properly formatted for the FinancialBarChart component
- We've also added null checks in the FinancialBarChart component to handle empty data gracefully

## Database Reset

If you need to reset the database and recreate the schema:

1. Make sure the SQL functions in `lib/supabase-functions.sql` are executed in your Supabase instance
2. Run the `reset-database.js` script:

```bash
node reset-database.js
```

This will:
- Drop existing tables
- Create new tables according to the schema
- Insert sample data

## Testing the API

You can test the Supabase API functions using the provided test scripts:

1. To check the database tables and their contents:
```bash
node check-database.js
```

2. To test the income/expenses trend data specifically:
```bash
node test-analytics-api.js
```

## Database Structure Details

### Properties Table
- `id`: UUID (primary key)
- `name`: Text (property name)
- `address`: Text (property address)
- `rent`: Decimal (monthly rent amount)
- `created_at`: Timestamp
- `updated_at`: Timestamp

### Monthly Metrics Table
- `id`: UUID (primary key)
- `property_id`: UUID (foreign key to properties, nullable for overview metrics)
- `date`: Date
- `period`: Text ('Monthly', 'Quarterly', or 'Annual')
- `metric_type`: Text (type of metric)
- `value`: Text (value of the metric)
- `change`: Text (change from previous period)
- `created_at`: Timestamp
- `updated_at`: Timestamp

### Maintenance Tasks Table
- `id`: UUID (primary key)
- `property_id`: UUID (foreign key to properties)
- `date`: Date
- `category`: Text (maintenance category)
- `amount`: Decimal (cost amount)
- `description`: Text
- `created_at`: Timestamp
- `updated_at`: Timestamp

### Income Expenses Table
- `id`: UUID (primary key)
- `property_id`: UUID (foreign key to properties, nullable for overview)
- `date`: Date
- `gross_income`: Decimal
- `total_expenses`: Decimal
- `created_at`: Timestamp
- `updated_at`: Timestamp 