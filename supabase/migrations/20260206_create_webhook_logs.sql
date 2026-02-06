-- Create webhook_logs table to debug incoming webhooks
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  headers JSONB,
  body JSONB,
  raw_body TEXT,
  ip_address TEXT
);

-- Enable RLS but allow inserts from service role
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role to insert logs
CREATE POLICY "Service role can insert webhook logs"
  ON public.webhook_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Allow service role to read logs
CREATE POLICY "Service role can read webhook logs"
  ON public.webhook_logs
  FOR SELECT
  TO service_role
  USING (true);

-- Create index for faster lookups
CREATE INDEX idx_webhook_logs_created_at ON public.webhook_logs(created_at DESC);
CREATE INDEX idx_webhook_logs_endpoint ON public.webhook_logs(endpoint);
