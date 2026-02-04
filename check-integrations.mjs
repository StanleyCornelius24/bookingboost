import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://scqzelgnxrasdwyiubpt.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjcXplbGdueHJhc2R3eWl1YnB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjMyOTY5OSwiZXhwIjoyMDc3OTA1Njk5fQ.dc-H6ZZhLZZ0uvlT6Dx1rQye8o5CtIt2Vltax8nZgVg'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkIntegrations() {
  console.log('Checking website_configs table...\n')

  const { data: configs, error } = await supabase
    .from('website_configs')
    .select(`
      *,
      hotels (
        id,
        name,
        website
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error:', error)
    return
  }

  if (!configs || configs.length === 0) {
    console.log('❌ No website integrations found in database')
    return
  }

  console.log(`✅ Found ${configs.length} website integration(s):\n`)

  configs.forEach((config, index) => {
    console.log(`${index + 1}. ${config.website_name}`)
    console.log(`   Hotel: ${config.hotels?.name || 'Unknown'}`)
    console.log(`   URL: ${config.website_url}`)
    console.log(`   Status: ${config.status}`)
    console.log(`   API Key: ${config.api_key.substring(0, 15)}...`)
    console.log(`   Created: ${new Date(config.created_at).toLocaleDateString()}`)
    console.log()
  })
}

checkIntegrations()
