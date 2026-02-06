import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://scqzelgnxrasdwyiubpt.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjcXplbGdueHJhc2R3eWl1YnB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjMyOTY5OSwiZXhwIjoyMDc3OTA1Njk5fQ.dc-H6ZZhLZZ0uvlT6Dx1rQye8o5CtIt2Vltax8nZgVg'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('Fixing admin access for stanley.cornelius@gmail.com...\n')

// Get user
const { data: users } = await supabase.auth.admin.listUsers()
const targetUser = users.users.find(u => u.email === 'stanley.cornelius@gmail.com')

if (!targetUser) {
  console.log('User not found')
  process.exit(1)
}

// Get hotels
const { data: hotels } = await supabase
  .from('hotels')
  .select('*')
  .eq('user_id', targetUser.id)

const adminHotel = hotels.find(h => h.name === 'Admin Hotel')
const turbineHotel = hotels.find(h => h.name === 'Turbine Hotel')

console.log('Current state:')
console.log('- Admin Hotel: is_primary =', adminHotel?.is_primary, ', display_order =', adminHotel?.display_order)
console.log('- Turbine Hotel: is_primary =', turbineHotel?.is_primary, ', display_order =', turbineHotel?.display_order)

console.log('\nFixing...')

// Set Admin Hotel as primary with display_order 0
await supabase
  .from('hotels')
  .update({
    is_primary: true,
    display_order: 0
  })
  .eq('id', adminHotel.id)

// Set Turbine Hotel as non-primary with display_order 1
await supabase
  .from('hotels')
  .update({
    is_primary: false,
    display_order: 1
  })
  .eq('id', turbineHotel.id)

console.log('✅ Updated hotel priorities')

// Verify
const { data: updatedHotels } = await supabase
  .from('hotels')
  .select('name, user_role, is_primary, display_order, created_at')
  .eq('user_id', targetUser.id)
  .order('is_primary', { ascending: false })
  .order('created_at', { ascending: true })

console.log('\nNew state:')
updatedHotels.forEach(h => {
  console.log(`- ${h.name}: is_primary = ${h.is_primary}, display_order = ${h.display_order}, user_role = ${h.user_role}`)
})

console.log('\n✅ Login will now redirect to: /dashboard-' + updatedHotels[0].user_role)
console.log('✅ Admin access restored!')
