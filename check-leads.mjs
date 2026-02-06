import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://scqzelgnxrasdwyiubpt.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjcXplbGdueHJhc2R3eWl1YnB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjMyOTY5OSwiZXhwIjoyMDc3OTA1Njk5fQ.dc-H6ZZhLZZ0uvlT6Dx1rQye8o5CtIt2Vltax8nZgVg'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkLeads() {
  console.log('Checking leads table...\n')

  const { data: leads, error } = await supabase
    .from('leads')
    .select(`
      *,
      hotels (name),
      website_configs (website_name)
    `)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error:', error)
    return
  }

  if (!leads || leads.length === 0) {
    console.log('❌ No leads found in database')
    return
  }

  console.log(`✅ Found ${leads.length} recent lead(s):\n`)

  leads.forEach((lead, index) => {
    console.log(`${index + 1}. ${lead.name || 'No name'}`)
    console.log(`   Email: ${lead.email}`)
    console.log(`   Hotel: ${lead.hotels?.name || 'Unknown'}`)
    console.log(`   Website: ${lead.website_configs?.website_name || 'Unknown'}`)
    console.log(`   Status: ${lead.status}`)
    console.log(`   Created: ${new Date(lead.created_at).toLocaleString()}`)
    console.log()
  })
}

checkLeads()
