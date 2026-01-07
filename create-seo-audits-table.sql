-- Create table for storing SEO audit results
CREATE TABLE IF NOT EXISTS seo_audits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  overall_score INTEGER NOT NULL,
  checks JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_seo_audits_hotel_id ON seo_audits(hotel_id);
CREATE INDEX IF NOT EXISTS idx_seo_audits_timestamp ON seo_audits(timestamp DESC);

-- Enable RLS
ALTER TABLE seo_audits ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own hotel's SEO audits
CREATE POLICY "Users can view their own hotel's SEO audits"
  ON seo_audits
  FOR SELECT
  USING (
    hotel_id IN (
      SELECT id FROM hotels WHERE user_id = auth.uid()
    )
  );

-- Policy for users to insert SEO audits for their own hotel
CREATE POLICY "Users can insert SEO audits for their own hotel"
  ON seo_audits
  FOR INSERT
  WITH CHECK (
    hotel_id IN (
      SELECT id FROM hotels WHERE user_id = auth.uid()
    )
  );

-- Policy for users to update their own hotel's SEO audits
CREATE POLICY "Users can update their own hotel's SEO audits"
  ON seo_audits
  FOR UPDATE
  USING (
    hotel_id IN (
      SELECT id FROM hotels WHERE user_id = auth.uid()
    )
  );
