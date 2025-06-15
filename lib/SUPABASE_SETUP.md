# Supabase Setup for Dwello Analytics

This guide will help you set up Supabase to power the analytics features in the Dwello app.

## Prerequisites

- A Supabase account (sign up at [supabase.com](https://supabase.com))
- A new Supabase project created

## Setup Steps

### 1. Create Tables in Supabase

1. Navigate to the SQL Editor in your Supabase dashboard
2. Copy the SQL from `supabase-schema.sql` and run it in the SQL Editor
3. This will create the necessary tables and insert sample data

### 2. Set Up Environment Variables

Create a `.env` file in the root of your project with the following variables:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Replace `your-project-url` and `your-anon-key` with your actual Supabase project URL and anon key from your Supabase dashboard (Project Settings > API).

### 3. Install Required Dependencies

Make sure you have installed the required dependencies:

```bash
npm install @supabase/supabase-js @react-native-async-storage/async-storage
```

## Database Schema

### Properties Table

Stores information about each property.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Property name |
| address | TEXT | Property address |
| rent | DECIMAL | Monthly rent amount |
| created_at | TIMESTAMP | Creation date |
| updated_at | TIMESTAMP | Last update date |

### Monthly Metrics Table

Stores metrics data for properties and overview.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| property_id | UUID | Foreign key to properties (NULL for overview) |
| date | DATE | Date the metrics are for |
| period | TEXT | 'Monthly', 'Quarterly', or 'Annual' |
| metric_type | TEXT | Type of metric (e.g., 'occupancyRate') |
| value | TEXT | Metric value |
| change | TEXT | Change from previous period (e.g., '+2%') |
| created_at | TIMESTAMP | Creation date |
| updated_at | TIMESTAMP | Last update date |

### Maintenance Tasks Table

Stores individual maintenance tasks and costs.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| property_id | UUID | Foreign key to properties |
| date | DATE | Date of the task |
| category | TEXT | Category (e.g., 'Plumbing') |
| amount | DECIMAL | Cost of the task |
| description | TEXT | Task description |
| created_at | TIMESTAMP | Creation date |
| updated_at | TIMESTAMP | Last update date |

### Income Expenses Table

Stores monthly income and expense data for charts.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| property_id | UUID | Foreign key to properties (NULL for overview) |
| date | DATE | Date of the record |
| gross_income | DECIMAL | Total income for the period |
| total_expenses | DECIMAL | Total expenses for the period |
| created_at | TIMESTAMP | Creation date |
| updated_at | TIMESTAMP | Last update date |

## API Functions

The `lib/supabase.js` file contains helper functions to interact with the database:

- `getProperties()`: Fetches all properties
- `getOverviewMetrics(period, dateRange)`: Fetches overview metrics for a specific period and date range
- `getPropertyMetrics(propertyId, period)`: Fetches metrics for a specific property
- `getMaintenanceCosts(propertyId, startDate, endDate)`: Fetches maintenance cost breakdown
- `getIncomeExpensesTrend(propertyId, months)`: Fetches income and expenses data for charts

## Adding New Data

To add new data to the database, you can:

1. Use the Supabase dashboard to manually add records
2. Create additional API functions in `lib/supabase.js` for inserting data
3. Use the Supabase REST API directly

## Troubleshooting

- If you see "Failed to load properties" error, check your Supabase URL and anon key
- If metrics aren't loading, verify that the table structure matches the expected schema
- For detailed error information, check the browser console or React Native debug tools 