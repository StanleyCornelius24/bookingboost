-- Add currency column to hotels table
-- This migration adds support for different currencies in hotel settings

ALTER TABLE hotels ADD COLUMN currency TEXT DEFAULT 'ZAR';

-- Update existing hotels to have ZAR as default currency
UPDATE hotels SET currency = 'ZAR' WHERE currency IS NULL OR currency = 'USD';

-- Add index for better performance on currency lookups
CREATE INDEX IF NOT EXISTS idx_hotels_currency ON hotels(currency);