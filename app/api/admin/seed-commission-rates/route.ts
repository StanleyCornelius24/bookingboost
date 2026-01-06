import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Check auth - must be admin
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is admin
    const { data: hotel } = await supabase
      .from('hotels')
      .select('user_role')
      .eq('user_id', session.user.id)
      .single()

    if (!hotel || hotel.user_role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get all hotels
    const { data: hotels, error: hotelsError } = await supabase
      .from('hotels')
      .select('id, name')

    if (hotelsError) {
      return NextResponse.json({ error: 'Failed to fetch hotels' }, { status: 500 })
    }

    const results = []

    for (const hotelRecord of hotels || []) {
      // Check if this hotel already has commission rates
      const { data: existing } = await supabase
        .from('commission_rates')
        .select('id')
        .eq('hotel_id', hotelRecord.id)
        .limit(1)

      if (existing && existing.length > 0) {
        results.push({ hotel: hotelRecord.name, status: 'skipped', message: 'Already has rates' })
        continue
      }

      // Insert default rates for this hotel
      const ratesToInsert = DEFAULT_CHANNELS.map(channel => ({
        hotel_id: hotelRecord.id,
        channel_name: channel.name,
        commission_rate: channel.rate,
        is_active: true
      }))

      const { error: insertError } = await supabase
        .from('commission_rates')
        .insert(ratesToInsert)

      if (insertError) {
        results.push({ hotel: hotelRecord.name, status: 'error', message: insertError.message })
      } else {
        results.push({ hotel: hotelRecord.name, status: 'success', count: ratesToInsert.length })
      }
    }

    return NextResponse.json({
      success: true,
      results
    })

  } catch (error) {
    console.error('Seed commission rates error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
