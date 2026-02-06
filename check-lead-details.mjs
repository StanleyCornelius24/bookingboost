import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://scqzelgnxrasdwyiubpt.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjcXplbGdueHJhc2R3eWl1YnB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjMyOTY5OSwiZXhwIjoyMDc3OTA1Njk5fQ.dc-H6ZZhLZZ0uvlT6Dx1rQye8o5CtIt2Vltax8nZgVg'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const { data: lead, error } = await supabase
  .from('leads')
  .select('*')
  .gte('created_at', '2026-02-06T00:00:00Z')
  .order('created_at', { ascending: false })
  .limit(1)
  .single()

if (error) {
  console.error('Error:', error)
  process.exit(1)
}

console.log('Latest Lead Details:\n')
console.log('Name:', lead.name)
console.log('Email:', lead.email)
console.log('Phone:', lead.phone)
console.log('Message:', lead.message)
console.log('\nBooking Details:')
console.log('Room Type (interested_in):', lead.interested_in)
console.log('Check-in (arrival_date):', lead.arrival_date)
console.log('Check-out (departure_date):', lead.departure_date)
console.log('Adults:', lead.adults)
console.log('Children:', lead.children)
console.log('Nationality:', lead.nationality)
console.log('\nForm Info:')
console.log('Form ID:', lead.form_id)
console.log('Entry ID:', lead.entry_id)
console.log('Source URL:', lead.source_url)
console.log('\nScoring:')
console.log('Quality:', lead.quality_category, `(${lead.quality_score})`)
console.log('Spam:', lead.is_spam, `(${lead.spam_score})`)
