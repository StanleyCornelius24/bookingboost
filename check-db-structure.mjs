import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://scqzelgnxrasdwyiubpt.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjcXplbGdueHJhc2R3eWl1YnB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjMyOTY5OSwiZXhwIjoyMDc3OTA1Njk5fQ.dc-H6ZZhLZZ0uvlT6Dx1rQye8o5CtIt2Vltax8nZgVg'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('Checking database structure...\n')

// Check if hotels table has owner_id or similar
const { data: hotels, error } = await supabase
  .from('hotels')
  .select('*')
  .limit(1)

if (error) {
  console.error('Error:', error)
} else if (hotels && hotels.length > 0) {
  console.log('Hotels table columns:')
  console.log(Object.keys(hotels[0]))
}

// Check users table structure (in auth schema)
const { data: users } = await supabase.auth.admin.listUsers()
if (users && users.users.length > 0) {
  console.log('\nAuth user properties:')
  console.log(Object.keys(users.users[0]))
  console.log('\nUser metadata:')
  console.log(users.users[0].user_metadata)
}

// Try to find the profiles table
const { data: profiles, error: profilesError } = await supabase
  .from('profiles')
  .select('*')
  .limit(1)

if (!profilesError && profiles) {
  console.log('\n✅ Profiles table exists with columns:')
  console.log(Object.keys(profiles[0] || {}))
}

// Check all tables
console.log('\nChecking for user-hotel relationship tables...')
const tables = ['user_hotels', 'hotel_users', 'hotel_members', 'team_members']

for (const table of tables) {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .limit(1)

  if (!error) {
    console.log(`✅ ${table} exists`)
    if (data && data.length > 0) {
      console.log(`   Columns: ${Object.keys(data[0]).join(', ')}`)
    }
  }
}
