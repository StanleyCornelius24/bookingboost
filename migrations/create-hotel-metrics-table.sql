-- Create hotel_metrics table to cache Google Analytics data
CREATE TABLE IF NOT EXISTS hotel_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  users INTEGER DEFAULT 0,
  sessions INTEGER DEFAULT 0,
  page_views INTEGER DEFAULT 0,
  bounce_rate DECIMAL(5,2),
  avg_session_duration DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hotel_id, date)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_hotel_metrics_hotel_date ON hotel_metrics(hotel_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_hotel_metrics_date ON hotel_metrics(date DESC);

-- Enable RLS
ALTER TABLE hotel_metrics ENABLE ROW LEVEL SECURITY;

-- Policy: Allow admins to read all metrics
CREATE POLICY "Admin users can view all metrics"
  ON hotel_metrics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hotels
      WHERE hotels.user_id = auth.uid()
      AND hotels.user_role = 'admin'
    )
  );

-- Policy: Allow hotel owners to view their own metrics
CREATE POLICY "Hotel owners can view their metrics"
  ON hotel_metrics
  FOR SELECT
  TO authenticated
  USING (
    hotel_id IN (
      SELECT id FROM hotels WHERE user_id = auth.uid()
    )
  );

-- Policy: Allow system to insert/update metrics
CREATE POLICY "System can manage metrics"
  ON hotel_metrics
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hotels
      WHERE hotels.user_id = auth.uid()
      AND hotels.user_role IN ('admin', 'agency')
    )
  );
