import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getSelectedHotel } from '@/lib/get-selected-hotel'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET - Fetch commission rates for the client's hotel
export async function GET(request: NextRequest) {
  try {
    // Get selected hotel ID from query parameter
    const { searchParams } = new URL(request.url)
    const selectedHotelId = searchParams.get('hotelId')

    // Get the hotel (selected or fallback to primary)
    const { hotel, error: hotelError, status } = await getSelectedHotel(selectedHotelId, 'id')

    if (hotelError || !hotel) {
      return NextResponse.json({ error: hotelError || 'Hotel not found' }, { status })
    }

    const hotelRecord = hotel as unknown as { id: string }
    const supabase = await createServerClient()

    // Fetch commission rates for this hotel
    const { data: rates, error: fetchError } = await supabase
      .from('commission_rates')
      .select('*')
      .eq('hotel_id', hotelRecord.id)
      .order('channel_name')

    if (fetchError) {
      console.error('Error fetching commission rates:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch commission rates' }, { status: 500 })
    }

    return NextResponse.json(rates || [], {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('Commission rates API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update commission rates
export async function PUT(request: NextRequest) {
  try {
    // Get selected hotel ID from query parameter
    const { searchParams } = new URL(request.url)
    const selectedHotelId = searchParams.get('hotelId')

    // Get the hotel (selected or fallback to primary)
    const { hotel, error: hotelError, status } = await getSelectedHotel(selectedHotelId, 'id')

    if (hotelError || !hotel) {
      return NextResponse.json({ error: hotelError || 'Hotel not found' }, { status })
    }

    const hotelRecord = hotel as unknown as { id: string }
    const supabase = await createServerClient()

    const body = await request.json()
    const { rates } = body

    if (!Array.isArray(rates)) {
      return NextResponse.json({ error: 'Invalid rates format' }, { status: 400 })
    }

    // Update each rate
    const updates = rates.map(async (rate) => {
      const { data, error: updateError } = await supabase
        .from('commission_rates')
        .update({
          commission_rate: rate.commission_rate,
          is_active: rate.is_active
        })
        .eq('hotel_id', hotelRecord.id)
        .eq('channel_name', rate.channel_name)

      if (updateError) {
        console.error(`Error updating rate for ${rate.channel_name}:`, updateError)
        throw updateError
      }

      return data
    })

    await Promise.all(updates)

    return NextResponse.json({ success: true }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('Commission rates update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
