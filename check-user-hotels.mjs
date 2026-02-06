import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://scqzelgnxrasdwyiubpt.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjcXplbGdueHJhc2R3eWl1YnB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjMyOTY5OSwiZXhwIjoyMDc3OTA1Njk5fQ.dc-H6ZZhLZZ0uvlT6Dx1rQye8o5CtIt2Vltax8nZgVg'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('Checking hotels for stanley.cornelius@gmail.com...\n')

// Get user
const { data: user } = await supabase.auth.admin.listUsers()
const targetUser = user.users.find(u => u.email === 'stanley.cornelius@gmail.com')

if (!targetUser) {
  console.log('User not found')
  process.exit(1)
}

console.log('User ID:', targetUser.id)

// Get hotels owned by this user
const { data: hotels, error } = await supabase
  .from('hotels')
  .select('*')
  .eq('user_id', targetUser.id)

if (error) {
  console.error('Error:', error)
} else if (!hotels || hotels.length === 0) {
  console.log('\n❌ No hotels found for this user')
  console.log('This is why the leads page is empty!')

  // Check all hotels
  const { data: allHotels } = await supabase
    .from('hotels')
    .select('id, name, email, user_id')

  console.log('\nAll hotels in database:')
  allHotels?.forEach(h => {
    console.log(`- ${h.name} (user_id: ${h.user_id || 'NULL'})`)
  })
} else {
  console.log('\n✅ Hotels found:')
  hotels.forEach(h => {
    console.log(`- ${h.name} (ID: ${h.id})`)
  })

  // Check leads count
  for (const hotel of hotels) {
    const { count } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('hotel_id', hotel.id)

    console.log(`  → ${count} total leads`)
  }
}
