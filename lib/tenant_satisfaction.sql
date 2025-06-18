-- Create tenant satisfaction table
CREATE TABLE IF NOT EXISTS tenant_satisfaction (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES profiles(id),
  house_id UUID NOT NULL REFERENCES properties(id),
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  submitted_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Enforce one rating per tenant per day
  CONSTRAINT unique_tenant_daily_rating UNIQUE (tenant_id, submitted_at)
);

-- Create index for faster querying
CREATE INDEX IF NOT EXISTS idx_tenant_satisfaction_house_date 
ON tenant_satisfaction(house_id, submitted_at);

-- Function to get property satisfaction average for a date range
CREATE OR REPLACE FUNCTION get_property_satisfaction_average(
  p_house_id UUID,
  p_start_date DATE DEFAULT (CURRENT_DATE - INTERVAL '30 days')::DATE,
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  average_score NUMERIC,
  total_ratings INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(AVG(score)::NUMERIC(10,2), 0) as average_score,
    COUNT(*) as total_ratings
  FROM
    tenant_satisfaction
  WHERE
    house_id = p_house_id
    AND submitted_at BETWEEN p_start_date AND p_end_date;
END;
$$;

-- RLS policies
ALTER TABLE tenant_satisfaction ENABLE ROW LEVEL SECURITY;

-- Tenants can only insert their own ratings
CREATE POLICY tenant_insert_own_ratings
  ON tenant_satisfaction
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM tenant_property_relationships tpr
      WHERE tpr.tenant_id = auth.uid() AND tpr.property_id = tenant_satisfaction.house_id
    )
  );

-- Tenants can only view their own ratings
CREATE POLICY tenant_select_own_ratings
  ON tenant_satisfaction
  FOR SELECT
  TO authenticated
  USING (tenant_id = auth.uid());

-- Landlords can view ratings for their properties
CREATE POLICY landlord_select_property_ratings
  ON tenant_satisfaction
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = tenant_satisfaction.house_id AND p.landlord_id = auth.uid()
    )
  ); 