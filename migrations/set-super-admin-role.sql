-- Update the role for the super admin user
-- Replace 'your-email@example.com' with your actual email address

UPDATE profiles
SET role = 'super_admin'
WHERE email = 'supaadmin@example.com';

-- Verify the update
SELECT id, email, role
FROM profiles
WHERE role = 'super_admin';
