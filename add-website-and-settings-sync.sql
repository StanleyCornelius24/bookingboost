-- Add website and last_settings_sync columns to hotels table

ALTER TABLE hotels ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS last_settings_sync TIMESTAMP WITH TIME ZONE;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_hotels_website ON hotels(website);
CREATE INDEX IF NOT EXISTS idx_hotels_last_settings_sync ON hotels(last_settings_sync);

-- Add comments
COMMENT ON COLUMN hotels.website IS 'Hotel website URL (required for SEO audits)';
COMMENT ON COLUMN hotels.last_settings_sync IS 'Last time settings were updated';
