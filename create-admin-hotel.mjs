import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createAdminHotel(userEmail) {
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

    // Check if hotels already exist
    const { data: existingHotels } = await supabase
      .from('hotels')
      .select('*')
      .eq('user_id', user.id)

    if (existingHotels && existingHotels.length > 0) {
      console.log(`Found ${existingHotels.length} existing hotel(s)`)

      // Update all to admin
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
      return
    }

    // No hotels exist - create a new admin hotel
    console.log('No hotels found. Creating admin hotel...')

    const { data: newHotel, error: createError } = await supabase
      .from('hotels')
      .insert({
        user_id: user.id,
        name: 'Admin Hotel',
        email: userEmail,
        website: null,
        currency: 'USD',
        user_role: 'admin',
        is_primary: true,
        display_order: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating hotel:', createError)
      return
    }

    console.log('\n✅ Admin hotel created successfully!')
    console.log(`Hotel ID: ${newHotel.id}`)
    console.log(`Hotel Name: ${newHotel.name}`)
    console.log(`User Role: ${newHotel.user_role}`)
    console.log('\nYou can now log in as admin.')
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

// Get email from command line argument
const userEmail = process.argv[2]

if (!userEmail) {
  console.log('Usage: node create-admin-hotel.mjs <user-email>')
  console.log('Example: node create-admin-hotel.mjs admin@example.com')
  process.exit(1)
}

createAdminHotel(userEmail)
