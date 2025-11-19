-- Change the default value of currency column from USD to ZAR in MySQL

-- Method 1: Using MODIFY (MySQL preferred syntax)
ALTER TABLE hotels MODIFY COLUMN currency TEXT DEFAULT 'ZAR';

-- Update existing records to use ZAR
UPDATE hotels SET currency = 'ZAR' WHERE currency IS NULL OR currency = 'USD';

-- Verify the changes
DESCRIBE hotels;
SELECT id, name, currency FROM hotels;