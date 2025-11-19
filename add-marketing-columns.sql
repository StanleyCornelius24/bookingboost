-- Add marketing integration columns to hotels table

ALTER TABLE hotels ADD COLUMN IF NOT EXISTS google_analytics_property_id VARCHAR(50);
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS google_ads_customer_id VARCHAR(50);
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS meta_ad_account_id VARCHAR(100);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_hotels_google_analytics_property_id ON hotels(google_analytics_property_id);
CREATE INDEX IF NOT EXISTS idx_hotels_google_ads_customer_id ON hotels(google_ads_customer_id);
CREATE INDEX IF NOT EXISTS idx_hotels_meta_ad_account_id ON hotels(meta_ad_account_id);
