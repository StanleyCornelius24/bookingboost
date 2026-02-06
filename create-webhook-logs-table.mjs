import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://scqzelgnxrasdwyiubpt.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjcXplbGdueHJhc2R3eWl1YnB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjMyOTY5OSwiZXhwIjoyMDc3OTA1Njk5fQ.dc-H6ZZhLZZ0uvlT6Dx1rQye8o5CtIt2Vltax8nZgVg'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' }
})

console.log('Creating webhook_logs table...\n')

// First, let's try to create the table by inserting a test record
// This will help us see if the table exists
const testRecord = {
  endpoint: '/api/test',
  method: 'POST',
  headers: { test: 'header' },
  body: { test: 'body' },
  raw_body: 'test',
  ip_address: '127.0.0.1'
}

const { data, error } = await supabase
  .from('webhook_logs')
  .insert(testRecord)
  .select()

if (error) {
  if (error.message.includes('does not exist') || error.code === '42P01') {
    console.log('❌ Table does not exist. Please create it manually in Supabase dashboard.')
    console.log('\nGo to: https://supabase.com/dashboard/project/scqzelgnxrasdwyiubpt/editor')
    console.log('\nRun this SQL:\n')
    console.log(`
-- Create webhook_logs table
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

-- Enable RLS
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role to insert and read
CREATE POLICY "Service role can manage webhook logs"
  ON public.webhook_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_webhook_logs_created_at ON public.webhook_logs(created_at DESC);
CREATE INDEX idx_webhook_logs_endpoint ON public.webhook_logs(endpoint);
    `)
  } else {
    console.error('❌ Error:', error)
  }
} else {
  console.log('✅ Table exists! Test record inserted:', data)

  // Clean up test record
  await supabase
    .from('webhook_logs')
    .delete()
    .eq('id', data[0].id)

  console.log('✅ Test record cleaned up')
}
