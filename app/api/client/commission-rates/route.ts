import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET - Fetch commission rates for the client's hotel
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Check auth
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's hotel
    const { data: hotel } = await supabase
      .from('hotels')
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })
    }

    // Fetch commission rates for this hotel
    const { data: rates, error } = await supabase
      .from('commission_rates')
      .select('*')
      .eq('hotel_id', hotel.id)
      .order('channel_name')

    if (error) {
      console.error('Error fetching commission rates:', error)
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
    const supabase = await createServerClient()

    // Check auth
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's hotel
    const { data: hotel } = await supabase
      .from('hotels')
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })
    }

    const body = await request.json()
    const { rates } = body

    if (!Array.isArray(rates)) {
      return NextResponse.json({ error: 'Invalid rates format' }, { status: 400 })
    }

    // Update each rate
    const updates = rates.map(async (rate) => {
      const { data, error } = await supabase
        .from('commission_rates')
        .update({
          commission_rate: rate.commission_rate,
          is_active: rate.is_active
        })
        .eq('hotel_id', hotel.id)
        .eq('channel_name', rate.channel_name)

      if (error) {
        console.error(`Error updating rate for ${rate.channel_name}:`, error)
        throw error
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
