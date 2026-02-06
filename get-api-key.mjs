import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://scqzelgnxrasdwyiubpt.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjcXplbGdueHJhc2R3eWl1YnB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjMyOTY5OSwiZXhwIjoyMDc3OTA1Njk5fQ.dc-H6ZZhLZZ0uvlT6Dx1rQye8o5CtIt2Vltax8nZgVg'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function getApiKey() {
  const { data: config } = await supabase
    .from('website_configs')
    .select('*')
    .eq('website_name', 'Turbine Hotel')
    .single()

  if (!config) {
    console.error('❌ Could not find Turbine Hotel configuration')
    return
  }

  console.log('═══════════════════════════════════════════════════════════')
  console.log('Turbine Hotel - Gravity Forms Webhook Configuration')
  console.log('═══════════════════════════════════════════════════════════\n')

  console.log('1️⃣  WEBHOOK URL:')
  console.log('https://bookingboost.vercel.app/api/integrations/gravity-forms/webhook\n')

  console.log('2️⃣  CUSTOM HEADER:')
  console.log('Header Name:  X-API-Key')
  console.log('Header Value: ' + config.api_key + '\n')

  console.log('3️⃣  CONFIGURATION STEPS:')
  console.log('   a. In Gravity Forms, go to Forms → Settings → Webhooks')
  console.log('   b. Add a new webhook')
  console.log('   c. Set Request URL to the webhook URL above')
  console.log('   d. Set Request Method to POST')
  console.log('   e. Set Request Format to JSON')
  console.log('   f. Add the custom header X-API-Key with the value above')
  console.log('   g. Select which form(s) to send webhooks for')
  console.log('   h. Save the webhook\n')

  console.log('4️⃣  TEST:')
  console.log('   Submit a test form and check the Leads page in the admin dashboard')
  console.log('═══════════════════════════════════════════════════════════')
}

getApiKey()
