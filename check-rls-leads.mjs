import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://scqzelgnxrasdwyiubpt.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjcXplbGdueHJhc2R3eWl1YnB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjMyOTY5OSwiZXhwIjoyMDc3OTA1Njk5fQ.dc-H6ZZhLZZ0uvlT6Dx1rQye8o5CtIt2Vltax8nZgVg'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testLeadInsert() {
  console.log('Testing lead insert with service role key...\n')

  // Get Turbine Hotel config
  const { data: config } = await supabase
    .from('website_configs')
    .select('id, hotel_id')
    .eq('website_name', 'Turbine Hotel')
    .single()

  if (!config) {
    console.error('❌ Could not find Turbine Hotel configuration')
    return
  }

  // Try to insert a test lead
  const testLead = {
    website_config_id: config.id,
    hotel_id: config.hotel_id,
    form_id: 'test-rls-check',
    entry_id: `test-${Date.now()}`,
    composite_key: `${config.id}:test-rls-check:test-${Date.now()}`,
    name: 'RLS Test User',
    email: 'rls-test@example.com',
    phone: '+27 123 456 789',
    message: 'Testing RLS policies',
    status: 'new',
    quality: 'medium',
    quality_score: 0.5,
    is_spam: false,
    spam_score: 0,
    source_url: 'https://test.com',
    ip_address: '127.0.0.1',
    user_agent: 'Test',
    raw_payload: {}
  }

  const { data: newLead, error } = await supabase
    .from('leads')
    .insert([testLead])
    .select()
    .single()

  if (error) {
    console.error('❌ Failed to insert lead:')
    console.error('Error:', error)
    console.error('\nThis might indicate an RLS policy issue or missing permissions')
    return
  }

  console.log('✅ Successfully inserted test lead!')
  console.log('Lead ID:', newLead.id)
  console.log('Name:', newLead.name)
  console.log('\nLead insert is working correctly.')
  console.log('The issue is likely with the Gravity Forms webhook configuration.')
}

testLeadInsert()
