import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://scqzelgnxrasdwyiubpt.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjcXplbGdueHJhc2R3eWl1YnB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjMyOTY5OSwiZXhwIjoyMDc3OTA1Njk5fQ.dc-H6ZZhLZZ0uvlT6Dx1rQye8o5CtIt2Vltax8nZgVg'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('Checking user and hotel access...\n')

// Get the user with email stanley.cornelius@gmail.com
const { data: user, error: userError } = await supabase.auth.admin.listUsers()

if (userError) {
  console.error('Error fetching users:', userError)
  process.exit(1)
}

const targetUser = user.users.find(u => u.email === 'stanley.cornelius@gmail.com')

if (!targetUser) {
  console.log('❌ User stanley.cornelius@gmail.com not found')
  process.exit(1)
}

console.log('✅ User found:', targetUser.email)
console.log('User ID:', targetUser.id)

// Check if user has hotel access
const { data: userHotels, error: hotelError } = await supabase
  .from('user_hotels')
  .select('*, hotels(id, name)')
  .eq('user_id', targetUser.id)

if (hotelError) {
  console.error('Error fetching user hotels:', hotelError)
} else if (!userHotels || userHotels.length === 0) {
  console.log('\n❌ User has no hotel access')
  console.log('This is why the leads page shows nothing!')
} else {
  console.log('\n✅ User has access to hotels:')
  userHotels.forEach(uh => {
    console.log(`- ${uh.hotels.name} (ID: ${uh.hotels.id}) - Role: ${uh.role}`)
  })
}

// Check all leads for Turbine Hotel
const { data: turbineHotel } = await supabase
  .from('hotels')
  .select('id, name')
  .eq('name', 'Turbine Hotel')
  .single()

if (turbineHotel) {
  console.log(`\n✅ Turbine Hotel found (ID: ${turbineHotel.id})`)

  const { data: leads, count } = await supabase
    .from('leads')
    .select('*', { count: 'exact' })
    .eq('hotel_id', turbineHotel.id)
    .gte('submitted_at', '2026-02-06T00:00:00Z')

  console.log(`✅ Total leads for Turbine Hotel today: ${count}`)
}
