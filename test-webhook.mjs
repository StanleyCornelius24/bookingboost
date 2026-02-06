import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://scqzelgnxrasdwyiubpt.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjcXplbGdueHJhc2R3eWl1YnB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjMyOTY5OSwiZXhwIjoyMDc3OTA1Njk5fQ.dc-H6ZZhLZZ0uvlT6Dx1rQye8o5CtIt2Vltax8nZgVg'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testWebhook() {
  // Get the API key from the database
  const { data: config } = await supabase
    .from('website_configs')
    .select('api_key')
    .eq('website_name', 'Turbine Hotel')
    .single()

  if (!config) {
    console.error('❌ Could not find Turbine Hotel configuration')
    return
  }

  const apiKey = config.api_key

  // Test payload simulating a Gravity Forms submission
  const testPayload = {
    form_id: '1',
    form_title: 'Contact Form',
    entry_id: '12345',
    fields: {
      '1': 'Test User',
      '2': 'test@example.com',
      '3': '+27 123 456 789',
      '4': 'This is a test enquiry message'
    },
    source_url: 'https://www.turbinehotel.co.za/contact',
    date_created: new Date().toISOString(),
    ip: '192.168.1.1',
    user_agent: 'Mozilla/5.0 Test'
  }

  console.log('Testing webhook endpoint...')
  console.log('API Key:', apiKey.substring(0, 15) + '...')
  console.log('\nSending test payload:\n', JSON.stringify(testPayload, null, 2))

  try {
    const response = await fetch('https://bookingboost.vercel.app/api/integrations/gravity-forms/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify(testPayload)
    })

    const result = await response.json()

    console.log('\n📬 Response status:', response.status)
    console.log('📬 Response:', JSON.stringify(result, null, 2))

    if (response.ok) {
      console.log('\n✅ Webhook is working!')
      console.log('Now check the leads table to see if the lead was created.')
    } else {
      console.log('\n❌ Webhook failed')
    }
  } catch (error) {
    console.error('\n❌ Error calling webhook:', error.message)
  }
}

testWebhook()
