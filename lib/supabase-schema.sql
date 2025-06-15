-- Create properties table
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  rent DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create monthly_metrics table
CREATE TABLE monthly_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id),
  date DATE NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('Monthly', 'Quarterly', 'Annual')),
  metric_type TEXT NOT NULL,
  value TEXT NOT NULL,
  change TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create maintenance_tasks table
CREATE TABLE maintenance_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id),
  date DATE NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create income_expenses table
CREATE TABLE income_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id),
  date DATE NOT NULL,
  gross_income DECIMAL(10, 2) NOT NULL,
  total_expenses DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample data for properties
INSERT INTO properties (name, address, rent) VALUES
('Bridgewater Road', '123 Bridgewater Road, London', 1200.00),
('Oak Avenue', '45 Oak Avenue, Manchester', 1500.00);

-- Insert sample monthly metrics for Overview (property_id is NULL)
-- Monthly metrics for Jan-Jun 2024
INSERT INTO monthly_metrics (property_id, date, period, metric_type, value, change) VALUES
(NULL, '2024-01-01', 'Monthly', 'occupancyRate', '95', '+2'),
(NULL, '2024-01-01', 'Monthly', 'maintenanceCosts', '450', '-15'),
(NULL, '2024-01-01', 'Monthly', 'grossIncome', '2700', '+5'),
(NULL, '2024-01-01', 'Monthly', 'totalExpenses', '850', '-8'),
(NULL, '2024-01-01', 'Monthly', 'netProfit', '1850', '+12'),
(NULL, '2024-01-01', 'Monthly', 'roi', '8.2', '+0.5');

-- Quarterly metrics
INSERT INTO monthly_metrics (property_id, date, period, metric_type, value, change) VALUES
(NULL, '2024-01-01', 'Quarterly', 'occupancyRate', '92', '+1'),
(NULL, '2024-01-01', 'Quarterly', 'maintenanceCosts', '1350', '-12'),
(NULL, '2024-01-01', 'Quarterly', 'grossIncome', '8100', '+4'),
(NULL, '2024-01-01', 'Quarterly', 'totalExpenses', '2550', '-6'),
(NULL, '2024-01-01', 'Quarterly', 'netProfit', '5550', '+10'),
(NULL, '2024-01-01', 'Quarterly', 'roi', '7.8', '+0.3');

-- Annual metrics
INSERT INTO monthly_metrics (property_id, date, period, metric_type, value, change) VALUES
(NULL, '2024-01-01', 'Annual', 'occupancyRate', '90', '+3'),
(NULL, '2024-01-01', 'Annual', 'maintenanceCosts', '5400', '-10'),
(NULL, '2024-01-01', 'Annual', 'grossIncome', '32400', '+6'),
(NULL, '2024-01-01', 'Annual', 'totalExpenses', '10200', '-5'),
(NULL, '2024-01-01', 'Annual', 'netProfit', '22200', '+15'),
(NULL, '2024-01-01', 'Annual', 'roi', '7.5', '+0.8');

-- Insert sample property-specific metrics for Bridgewater Road
-- Get the property ID for Bridgewater Road
DO $$
DECLARE
  bridgewater_id UUID;
  oak_avenue_id UUID;
BEGIN
  SELECT id INTO bridgewater_id FROM properties WHERE name = 'Bridgewater Road';
  SELECT id INTO oak_avenue_id FROM properties WHERE name = 'Oak Avenue';
  
  -- Monthly metrics for Bridgewater Road
  INSERT INTO monthly_metrics (property_id, date, period, metric_type, value, change) VALUES
  (bridgewater_id, '2024-01-01', 'Monthly', 'occupancyRate', '95', '+2'),
  (bridgewater_id, '2024-01-01', 'Monthly', 'maintenanceCosts', '450', '-15'),
  (bridgewater_id, '2024-01-01', 'Monthly', 'grossIncome', '1200', '+5'),
  (bridgewater_id, '2024-01-01', 'Monthly', 'totalExpenses', '650', '-8'),
  (bridgewater_id, '2024-01-01', 'Monthly', 'netProfit', '550', '+12');
  
  -- Quarterly metrics for Bridgewater Road
  INSERT INTO monthly_metrics (property_id, date, period, metric_type, value, change) VALUES
  (bridgewater_id, '2024-01-01', 'Quarterly', 'occupancyRate', '92', '+1'),
  (bridgewater_id, '2024-01-01', 'Quarterly', 'maintenanceCosts', '1350', '-12'),
  (bridgewater_id, '2024-01-01', 'Quarterly', 'grossIncome', '3600', '+4'),
  (bridgewater_id, '2024-01-01', 'Quarterly', 'totalExpenses', '1950', '-6'),
  (bridgewater_id, '2024-01-01', 'Quarterly', 'netProfit', '1650', '+10');
  
  -- Annual metrics for Bridgewater Road
  INSERT INTO monthly_metrics (property_id, date, period, metric_type, value, change) VALUES
  (bridgewater_id, '2024-01-01', 'Annual', 'occupancyRate', '90', '+3'),
  (bridgewater_id, '2024-01-01', 'Annual', 'maintenanceCosts', '5400', '-10'),
  (bridgewater_id, '2024-01-01', 'Annual', 'grossIncome', '14400', '+6'),
  (bridgewater_id, '2024-01-01', 'Annual', 'totalExpenses', '7800', '-5'),
  (bridgewater_id, '2024-01-01', 'Annual', 'netProfit', '6600', '+15');
  
  -- Monthly metrics for Oak Avenue
  INSERT INTO monthly_metrics (property_id, date, period, metric_type, value, change) VALUES
  (oak_avenue_id, '2024-01-01', 'Monthly', 'occupancyRate', '98', '+3'),
  (oak_avenue_id, '2024-01-01', 'Monthly', 'maintenanceCosts', '380', '-20'),
  (oak_avenue_id, '2024-01-01', 'Monthly', 'grossIncome', '1500', '+8'),
  (oak_avenue_id, '2024-01-01', 'Monthly', 'totalExpenses', '580', '-12'),
  (oak_avenue_id, '2024-01-01', 'Monthly', 'netProfit', '920', '+18');
  
  -- Quarterly metrics for Oak Avenue
  INSERT INTO monthly_metrics (property_id, date, period, metric_type, value, change) VALUES
  (oak_avenue_id, '2024-01-01', 'Quarterly', 'occupancyRate', '96', '+2'),
  (oak_avenue_id, '2024-01-01', 'Quarterly', 'maintenanceCosts', '1140', '-15'),
  (oak_avenue_id, '2024-01-01', 'Quarterly', 'grossIncome', '4500', '+6'),
  (oak_avenue_id, '2024-01-01', 'Quarterly', 'totalExpenses', '1740', '-8'),
  (oak_avenue_id, '2024-01-01', 'Quarterly', 'netProfit', '2760', '+15');
  
  -- Annual metrics for Oak Avenue
  INSERT INTO monthly_metrics (property_id, date, period, metric_type, value, change) VALUES
  (oak_avenue_id, '2024-01-01', 'Annual', 'occupancyRate', '94', '+4'),
  (oak_avenue_id, '2024-01-01', 'Annual', 'maintenanceCosts', '4560', '-12'),
  (oak_avenue_id, '2024-01-01', 'Annual', 'grossIncome', '18000', '+7'),
  (oak_avenue_id, '2024-01-01', 'Annual', 'totalExpenses', '6960', '-6'),
  (oak_avenue_id, '2024-01-01', 'Annual', 'netProfit', '11040', '+20');
  
  -- Insert sample maintenance costs
  INSERT INTO maintenance_tasks (property_id, date, category, amount, description) VALUES
  (bridgewater_id, '2024-01-15', 'Plumbing', 150.00, 'Fixed leaking sink'),
  (bridgewater_id, '2024-02-10', 'Electrical', 120.00, 'Replaced faulty outlets'),
  (bridgewater_id, '2024-03-05', 'HVAC', 80.00, 'AC maintenance'),
  (bridgewater_id, '2024-04-20', 'General Repairs', 150.00, 'Wall patching and painting'),
  (oak_avenue_id, '2024-01-25', 'Plumbing', 200.00, 'Fixed bathroom leak'),
  (oak_avenue_id, '2024-02-15', 'Electrical', 100.00, 'Light fixture replacement'),
  (oak_avenue_id, '2024-03-10', 'HVAC', 150.00, 'Heater repair'),
  (oak_avenue_id, '2024-04-05', 'General Repairs', 120.00, 'Door repair');
  
  -- Insert sample income and expenses data for chart
  INSERT INTO income_expenses (property_id, date, gross_income, total_expenses) VALUES
  (NULL, '2024-01-01', 2700.00, 400.00),
  (NULL, '2024-02-01', 2700.00, 550.00),
  (NULL, '2024-03-01', 2700.00, 300.00),
  (NULL, '2024-04-01', 2700.00, 350.00),
  (NULL, '2024-05-01', 2700.00, 200.00),
  (NULL, '2024-06-01', 2700.00, 200.00),
  (bridgewater_id, '2024-01-01', 1200.00, 200.00),
  (bridgewater_id, '2024-02-01', 1200.00, 250.00),
  (bridgewater_id, '2024-03-01', 1200.00, 150.00),
  (bridgewater_id, '2024-04-01', 1200.00, 200.00),
  (bridgewater_id, '2024-05-01', 1200.00, 100.00),
  (bridgewater_id, '2024-06-01', 1200.00, 100.00),
  (oak_avenue_id, '2024-01-01', 1500.00, 300.00),
  (oak_avenue_id, '2024-02-01', 1500.00, 350.00),
  (oak_avenue_id, '2024-03-01', 1500.00, 250.00),
  (oak_avenue_id, '2024-04-01', 1500.00, 300.00),
  (oak_avenue_id, '2024-05-01', 1500.00, 200.00),
  (oak_avenue_id, '2024-06-01', 1500.00, 200.00);
END $$; 