-- Add google_my_business_location_id column to hotels table
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS google_my_business_location_id TEXT;

-- Add comment to the column
COMMENT ON COLUMN hotels.google_my_business_location_id IS 'Google Business Profile location identifier (e.g., locations/12345678901234567890)';
