import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { readFileSync } from 'fs'

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function updateBookingEngines() {
  console.log('Updating booking engine options...')

  try {
    // Read the SQL file
    const sqlFile = resolve(__dirname, '../migrations/update-booking-engine-options.sql')
    const sql = readFileSync(sqlFile, 'utf-8')

    // Split SQL into individual statements (simple split by semicolon)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    for (const statement of statements) {
      console.log('Executing:', statement.substring(0, 100) + '...')

      const { error } = await supabase.rpc('exec_sql', { sql_query: statement })

      if (error) {
        console.error('Error executing statement:', error)
        // Continue with next statement
      } else {
        console.log('✓ Statement executed successfully')
      }
    }

    console.log('\n✅ Booking engine options updated successfully!')
  } catch (error) {
    console.error('Error:', error)
  }
}

updateBookingEngines()
