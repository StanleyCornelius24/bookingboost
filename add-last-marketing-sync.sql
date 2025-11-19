-- Add last_marketing_sync column to hotels table

ALTER TABLE hotels ADD COLUMN IF NOT EXISTS last_marketing_sync TIMESTAMP WITH TIME ZONE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_hotels_last_marketing_sync ON hotels(last_marketing_sync);

-- Add comment
COMMENT ON COLUMN hotels.last_marketing_sync IS 'Last time marketing data was synced from external APIs';
