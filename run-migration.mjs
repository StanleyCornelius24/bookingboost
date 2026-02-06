import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const supabaseUrl = 'https://scqzelgnxrasdwyiubpt.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjcXplbGdueHJhc2R3eWl1YnB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjMyOTY5OSwiZXhwIjoyMDc3OTA1Njk5fQ.dc-H6ZZhLZZ0uvlT6Dx1rQye8o5CtIt2Vltax8nZgVg'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const sql = readFileSync('./supabase/migrations/20260206_create_webhook_logs.sql', 'utf-8')

console.log('Running migration...\n')

const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).single()

if (error) {
  // Try direct execution if rpc doesn't work
  console.log('RPC failed, trying direct SQL execution...')

  // Split by semicolons and execute each statement
  const statements = sql.split(';').filter(s => s.trim())

  for (const statement of statements) {
    if (!statement.trim()) continue

    console.log(`Executing: ${statement.trim().substring(0, 50)}...`)
    const { error: execError } = await supabase.rpc('exec_sql', { sql_string: statement })

    if (execError) {
      console.error('Error:', execError)
    } else {
      console.log('✓ Success')
    }
  }
} else {
  console.log('✓ Migration completed successfully!')
}
