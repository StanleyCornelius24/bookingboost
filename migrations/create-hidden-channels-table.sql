-- Create hidden_channels table to track channels that users want to hide from their reports
CREATE TABLE IF NOT EXISTS hidden_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  channel_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(hotel_id, channel_name)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_hidden_channels_hotel_id ON hidden_channels(hotel_id);

-- Add RLS policies
ALTER TABLE hidden_channels ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own hidden channels
CREATE POLICY "Users can view own hidden channels"
  ON hidden_channels
  FOR SELECT
  USING (
    hotel_id IN (
      SELECT id FROM hotels WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can insert their own hidden channels
CREATE POLICY "Users can insert own hidden channels"
  ON hidden_channels
  FOR INSERT
  WITH CHECK (
    hotel_id IN (
      SELECT id FROM hotels WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can delete their own hidden channels
CREATE POLICY "Users can delete own hidden channels"
  ON hidden_channels
  FOR DELETE
  USING (
    hotel_id IN (
      SELECT id FROM hotels WHERE user_id = auth.uid()
    )
  );
