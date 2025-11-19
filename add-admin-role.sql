-- Add admin role to the existing user_role constraint
-- This migration adds 'admin' as a valid role

-- Step 1: Drop the existing constraint
ALTER TABLE hotels DROP CONSTRAINT IF EXISTS check_user_role;

-- Step 2: Add the new constraint with admin role
ALTER TABLE hotels ADD CONSTRAINT check_user_role
CHECK (user_role IN ('agency', 'client', 'admin'));

-- Step 3: Create a sample admin user (update the email to your actual admin email)
-- Example: UPDATE hotels SET user_role = 'admin' WHERE email = 'admin@bookingboost.com';

-- Note: You can also create a dedicated admin user by signing up normally,
-- then running: UPDATE hotels SET user_role = 'admin' WHERE email = 'your-admin-email@example.com';
