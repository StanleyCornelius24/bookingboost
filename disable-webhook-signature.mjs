import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://scqzelgnxrasdwyiubpt.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjcXplbGdueHJhc2R3eWl1YnB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjMyOTY5OSwiZXhwIjoyMDc3OTA1Njk5fQ.dc-H6ZZhLZZ0uvlT6Dx1rQye8o5CtIt2Vltax8nZgVg'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function disableWebhookSignature() {
  console.log('Disabling webhook signature verification for Turbine Hotel...\n')

  const { data, error } = await supabase
    .from('website_configs')
    .update({ webhook_secret: null })
    .eq('website_name', 'Turbine Hotel')
    .select()

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  console.log('✅ Webhook signature verification disabled!')
  console.log('The integration will now accept requests with just the API key.\n')
  console.log('Updated config:', data[0]?.website_name)
}

disableWebhookSignature()
