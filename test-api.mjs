import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://scqzelgnxrasdwyiubpt.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjcXplbGdueHJhc2R3eWl1YnB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzMjk2OTksImV4cCI6MjA3NzkwNTY5OX0.E40dwSq6fUlGrEU3i0l1a66X3ywuQJv6s_iZ2w-_rmo'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAPI() {
  // First, sign in
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'stanley.cornelius@gmail.com',
    password: 'Knysna@2025'
  })

  if (authError) {
    console.error('Auth error:', authError)
    return
  }

  console.log('✅ Authenticated\n')

  // Now test the API
  const response = await fetch('http://localhost:3000/api/admin/website-configs/all', {
    headers: {
      'Authorization': `Bearer ${authData.session.access_token}`,
      'Content-Type': 'application/json'
    }
  })

  const data = await response.json()

  console.log('Status:', response.status)
  console.log('Response:', JSON.stringify(data, null, 2))
}

testAPI()
