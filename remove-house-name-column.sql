-- Remove house_name column from house_analytics table
-- This script removes the house_name column since we'll be getting house names from the houses table

-- First, let's check if the column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'house_analytics' 
        AND column_name = 'house_name'
    ) THEN
        -- Remove the house_name column
        ALTER TABLE house_analytics DROP COLUMN house_name;
        RAISE NOTICE 'house_name column removed from house_analytics table';
    ELSE
        RAISE NOTICE 'house_name column does not exist in house_analytics table';
    END IF;
END $$;

-- Verify the column was removed
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'house_analytics' 
ORDER BY ordinal_position; 