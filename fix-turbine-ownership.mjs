import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://scqzelgnxrasdwyiubpt.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjcXplbGdueHJhc2R3eWl1YnB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjMyOTY5OSwiZXhwIjoyMDc3OTA1Njk5fQ.dc-H6ZZhLZZ0uvlT6Dx1rQye8o5CtIt2Vltax8nZgVg'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('Fixing Turbine Hotel ownership...\n')

// Get the target user
const { data: users } = await supabase.auth.admin.listUsers()
const targetUser = users.users.find(u => u.email === 'stanley.cornelius@gmail.com')

if (!targetUser) {
  console.log('User not found')
  process.exit(1)
}

console.log('Target user:', targetUser.email, '(ID:', targetUser.id + ')')

// Get Turbine Hotel
const { data: turbineHotel, error: getError } = await supabase
  .from('hotels')
  .select('*')
  .eq('name', 'Turbine Hotel')
  .single()

if (getError || !turbineHotel) {
  console.error('Turbine Hotel not found:', getError)
  process.exit(1)
}

console.log('\nTurbine Hotel:')
console.log('- ID:', turbineHotel.id)
console.log('- Current owner (user_id):', turbineHotel.user_id || 'NULL')

// Update ownership
console.log('\nUpdating ownership to stanley.cornelius@gmail.com...')

const { error: updateError } = await supabase
  .from('hotels')
  .update({ user_id: targetUser.id })
  .eq('id', turbineHotel.id)

if (updateError) {
  console.error('❌ Error updating:', updateError)
} else {
  console.log('✅ Successfully updated Turbine Hotel ownership')

  // Verify leads are now accessible
  const { count } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('hotel_id', turbineHotel.id)

  console.log(`✅ Turbine Hotel now has ${count} leads accessible to this user`)
}
