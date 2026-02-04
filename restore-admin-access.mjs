import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function restoreAdminAccess(userEmail) {
  try {
    console.log(`Looking for user with email: ${userEmail}`)

    // Get the user by email
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers()

    if (userError) {
      console.error('Error fetching users:', userError)
      return
    }

    const user = users.find(u => u.email === userEmail)

    if (!user) {
      console.error(`User not found with email: ${userEmail}`)
      return
    }

    console.log(`Found user: ${user.email} (ID: ${user.id})`)

    // Update all hotels for this user to have admin role
    const { data: hotels, error: hotelsError } = await supabase
      .from('hotels')
      .select('*')
      .eq('user_id', user.id)

    if (hotelsError) {
      console.error('Error fetching hotels:', hotelsError)
      return
    }

    if (!hotels || hotels.length === 0) {
      console.error(`No hotels found for user: ${userEmail}`)
      return
    }

    console.log(`Found ${hotels.length} hotel(s) for this user`)

    // Update all hotels to admin role
    const { data: updated, error: updateError } = await supabase
      .from('hotels')
      .update({ user_role: 'admin' })
      .eq('user_id', user.id)
      .select()

    if (updateError) {
      console.error('Error updating hotels:', updateError)
      return
    }

    console.log('\n✅ Admin access restored!')
    console.log(`Updated ${updated.length} hotel record(s) to admin role`)
    console.log('\nYou can now log in as admin.')
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

// Get email from command line argument
const userEmail = process.argv[2]

if (!userEmail) {
  console.log('Usage: node restore-admin-access.mjs <user-email>')
  console.log('Example: node restore-admin-access.mjs admin@example.com')
  process.exit(1)
}

restoreAdminAccess(userEmail)
