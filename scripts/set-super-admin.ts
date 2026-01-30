import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setSuperAdmin(email: string) {
  console.log(`Setting super_admin role for user: ${email}`)

  // First, check if the user exists
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('id, email, role')
    .eq('email', email)
    .single()

  if (fetchError) {
    console.error('Error fetching user:', fetchError)
    process.exit(1)
  }

  console.log('Current profile:', profile)

  // Update the role
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: 'super_admin' })
    .eq('email', email)
    .select()

  if (error) {
    console.error('Error updating role:', error)
    process.exit(1)
  }

  console.log('Updated profile:', data)
  console.log(`✓ Successfully set ${email} as super_admin`)
}

// Get email from command line argument
const email = process.argv[2]

if (!email) {
  console.error('Usage: npx tsx scripts/set-super-admin.ts <email>')
  process.exit(1)
}

setSuperAdmin(email)
  .catch(console.error)
  .finally(() => process.exit(0))
