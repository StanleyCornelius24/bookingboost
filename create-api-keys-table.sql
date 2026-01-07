-- Create table for API keys
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(key);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);

-- Enable RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own API keys
CREATE POLICY "Users can view their own API keys"
  ON api_keys
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for users to insert their own API keys
CREATE POLICY "Users can insert their own API keys"
  ON api_keys
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own API keys
CREATE POLICY "Users can update their own API keys"
  ON api_keys
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy for users to delete their own API keys
CREATE POLICY "Users can delete their own API keys"
  ON api_keys
  FOR DELETE
  USING (auth.uid() = user_id);
