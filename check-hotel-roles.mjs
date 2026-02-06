import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://scqzelgnxrasdwyiubpt.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjcXplbGdueHJhc2R3eWl1YnB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjMyOTY5OSwiZXhwIjoyMDc3OTA1Njk5fQ.dc-H6ZZhLZZ0uvlT6Dx1rQye8o5CtIt2Vltax8nZgVg'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('Checking hotel roles for stanley.cornelius@gmail.com...\n')

// Get user
const { data: users } = await supabase.auth.admin.listUsers()
const targetUser = users.users.find(u => u.email === 'stanley.cornelius@gmail.com')

if (!targetUser) {
  console.log('User not found')
  process.exit(1)
}

// Get user's hotels
const { data: hotels, error } = await supabase
  .from('hotels')
  .select('*')
  .eq('user_id', targetUser.id)
  .order('is_primary', { ascending: false })
  .order('created_at', { ascending: true })

if (error) {
  console.error('Error:', error)
  process.exit(1)
}

console.log(`Found ${hotels.length} hotel(s):\n`)

hotels.forEach((hotel, index) => {
  console.log(`${index + 1}. ${hotel.name}`)
  console.log(`   - ID: ${hotel.id}`)
  console.log(`   - user_role: ${hotel.user_role || 'NULL'}`)
  console.log(`   - is_primary: ${hotel.is_primary}`)
  console.log(`   - display_order: ${hotel.display_order}`)
  console.log(`   - created_at: ${hotel.created_at}`)
  console.log('')
})

console.log('Login redirect logic:')
console.log('- Selects first hotel (ordered by is_primary DESC, created_at ASC)')
console.log(`- First hotel: ${hotels[0]?.name}`)
console.log(`- user_role: ${hotels[0]?.user_role}`)
console.log(`- Redirects to: /dashboard-${hotels[0]?.user_role || 'client'}`)
