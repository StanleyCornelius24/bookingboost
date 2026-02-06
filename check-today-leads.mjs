import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://scqzelgnxrasdwyiubpt.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjcXplbGdueHJhc2R3eWl1YnB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjMyOTY5OSwiZXhwIjoyMDc3OTA1Njk5fQ.dc-H6ZZhLZZ0uvlT6Dx1rQye8o5CtIt2Vltax8nZgVg'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('Checking leads from today (Feb 6, 2026)...\n')

// Get all leads created today
const { data: leads, error } = await supabase
  .from('leads')
  .select(`
    *,
    hotels!inner(name),
    website_configs!inner(website_name)
  `)
  .gte('created_at', '2026-02-06T00:00:00Z')
  .order('created_at', { ascending: false })

if (error) {
  console.error('❌ Error:', error)
  process.exit(1)
}

if (!leads || leads.length === 0) {
  console.log('❌ No leads found from today')

  // Check the most recent lead
  const { data: recentLead } = await supabase
    .from('leads')
    .select('*, hotels(name), website_configs(website_name)')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (recentLead) {
    console.log('\nMost recent lead:')
    console.log(`Created: ${new Date(recentLead.created_at).toLocaleString()}`)
    console.log(`Name: ${recentLead.name}`)
    console.log(`Email: ${recentLead.email}`)
  }
} else {
  console.log(`✅ Found ${leads.length} lead(s) from today:\n`)

  leads.forEach((lead, index) => {
    console.log(`${index + 1}. ${lead.name}`)
    console.log(`   Email: ${lead.email}`)
    console.log(`   Phone: ${lead.phone || 'N/A'}`)
    console.log(`   Hotel: ${lead.hotels.name}`)
    console.log(`   Website: ${lead.website_configs.website_name}`)
    console.log(`   Status: ${lead.status}`)
    console.log(`   Message: ${lead.message?.substring(0, 100)}${lead.message?.length > 100 ? '...' : ''}`)
    console.log(`   Created: ${new Date(lead.created_at).toLocaleString()}`)
    console.log('')
  })
}
