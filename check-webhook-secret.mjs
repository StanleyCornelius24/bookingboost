import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://scqzelgnxrasdwyiubpt.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjcXplbGdueHJhc2R3eWl1YnB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjMyOTY5OSwiZXhwIjoyMDc3OTA1Njk5fQ.dc-H6ZZhLZZ0uvlT6Dx1rQye8o5CtIt2Vltax8nZgVg'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkWebhookSecret() {
  const { data: config } = await supabase
    .from('website_configs')
    .select('*')
    .eq('website_name', 'Turbine Hotel')
    .single()

  if (!config) {
    console.error('❌ Could not find Turbine Hotel configuration')
    return
  }

  console.log('Turbine Hotel Integration:')
  console.log('API Key:', config.api_key.substring(0, 15) + '...')
  console.log('Webhook Secret:', config.webhook_secret ? config.webhook_secret.substring(0, 10) + '...' : 'NOT SET')
  console.log('\nWebhook secret is', config.webhook_secret ? 'ENABLED' : 'DISABLED')

  if (config.webhook_secret) {
    console.log('\n⚠️  Signature verification is REQUIRED')
    console.log('To disable it, run: node disable-webhook-signature.mjs')
  } else {
    console.log('\n✅ Signature verification is DISABLED (API key only)')
  }
}

checkWebhookSecret()
