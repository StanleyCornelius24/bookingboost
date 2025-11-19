-- Add user_role field to distinguish between agency and client users
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS user_role TEXT DEFAULT 'client';

-- Set specific agency email
UPDATE hotels SET user_role = 'agency' WHERE email = 'your-agency-email@focusonline.co.za';

-- Add check constraint to ensure only valid roles
ALTER TABLE hotels ADD CONSTRAINT check_user_role
CHECK (user_role IN ('agency', 'client'));