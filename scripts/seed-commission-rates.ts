import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

const DEFAULT_CHANNELS = [
  { name: 'Booking.com', rate: 0.15 },
  { name: 'Expedia', rate: 0.18 },
  { name: 'Direct Booking', rate: 0.00 },
  { name: 'Hotelbeds', rate: 0.20 },
  { name: 'followme2AFRICA', rate: 0.10 },
  { name: 'Tourplan', rate: 0.10 },
  { name: 'Thompsons Holidays', rate: 0.15 },
  { name: 'Holiday Travel Group', rate: 0.15 },
  { name: 'Thompsons Africa (New)', rate: 0.15 },
  { name: 'Airbnb', rate: 0.15 },
  { name: 'Agoda', rate: 0.16 },
  { name: 'Hotels.com', rate: 0.18 },
  { name: 'Sabre', rate: 0.12 },
  { name: 'Amadeus', rate: 0.12 },
  { name: 'Other', rate: 0.10 }
]

async function seedCommissionRates() {
  console.log('Fetching all hotels...')

  // Get all hotels
  const { data: hotels, error: hotelsError } = await supabase
    .from('hotels')
    .select('id, name')

  if (hotelsError) {
    console.error('Error fetching hotels:', hotelsError)
    return
  }

  console.log(`Found ${hotels?.length || 0} hotels`)

  for (const hotel of hotels || []) {
    console.log(`\nProcessing hotel: ${hotel.name} (${hotel.id})`)

    // Check if this hotel already has commission rates
    const { data: existing } = await supabase
      .from('commission_rates')
      .select('id')
      .eq('hotel_id', hotel.id)
      .limit(1)

    if (existing && existing.length > 0) {
      console.log(`  ✓ Hotel already has commission rates, skipping`)
      continue
    }

    // Insert default rates for this hotel
    const ratesToInsert = DEFAULT_CHANNELS.map(channel => ({
      hotel_id: hotel.id,
      channel_name: channel.name,
      commission_rate: channel.rate,
      is_active: true
    }))

    const { error: insertError } = await supabase
      .from('commission_rates')
      .insert(ratesToInsert)

    if (insertError) {
      console.error(`  ✗ Error inserting rates:`, insertError)
    } else {
      console.log(`  ✓ Inserted ${ratesToInsert.length} default commission rates`)
    }
  }

  console.log('\n✅ Commission rates seeding complete!')
}

seedCommissionRates().catch(console.error)
