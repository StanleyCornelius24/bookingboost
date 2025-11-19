-- Update existing hotels to use ZAR as default currency
-- This script only updates the values, doesn't create the column

UPDATE hotels SET currency = 'ZAR' WHERE currency IS NULL OR currency = 'USD';

-- Verify the update
SELECT id, name, currency FROM hotels;