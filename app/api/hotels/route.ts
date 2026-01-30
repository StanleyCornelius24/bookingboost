import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET all hotels for the authenticated user
export async function GET() {
  try {
    const supabase = await createServerClient()

    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch all hotels for this user, ordered by display_order
    const { data: hotels, error } = await supabase
      .from('hotels')
      .select('*')
      .eq('user_id', session.user.id)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching hotels:', error)
      return NextResponse.json(
        { error: 'Failed to fetch hotels' },
        { status: 500 }
      )
    }

    return NextResponse.json({ hotels })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      name,
      email,
      website,
      currency,
      is_primary,
      google_analytics_property_id,
      google_ads_customer_id,
      google_ads_manager_id,
      meta_ad_account_id
    } = body

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Hotel name and email are required' },
        { status: 400 }
      )
    }

    // Check how many hotels the user has to determine display_order and is_primary
    const { data: existingHotels, count } = await supabase
      .from('hotels')
      .select('id', { count: 'exact' })
      .eq('user_id', session.user.id)

    // First hotel should be primary by default
    const isPrimaryHotel = count === 0 || is_primary === true

    // If setting this as primary, unset other hotels
    if (isPrimaryHotel && count && count > 0) {
      await supabase
        .from('hotels')
        .update({ is_primary: false })
        .eq('user_id', session.user.id)
    }

    // Create hotel
    const { data: hotel, error } = await supabase
      .from('hotels')
      .insert({
        name: name.trim(),
        email: email.trim(),
        website: website?.trim() || null,
        currency: currency || 'ZAR',
        user_id: session.user.id,
        is_primary: isPrimaryHotel,
        display_order: count || 0,
        google_analytics_property_id: google_analytics_property_id || null,
        google_ads_customer_id: google_ads_customer_id || null,
        google_ads_manager_id: google_ads_manager_id || null,
        meta_ad_account_id: meta_ad_account_id || null
      })
      .select()
      .single()

    if (error) {
      console.error('Hotel creation error:', JSON.stringify(error, null, 2))
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      console.error('Error details:', error.details)

      // Handle specific error cases
      if (error.code === '23505') {
        // Duplicate key constraint violation
        if (error.message.includes('hotels_email_key')) {
          return NextResponse.json(
            { error: 'A hotel with this email address already exists. Please use a different email.' },
            { status: 400 }
          )
        }
        return NextResponse.json(
          { error: 'This hotel already exists in your account.' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to create hotel profile', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Hotel profile created successfully',
      hotel
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get hotel ID from query params
    const { searchParams } = new URL(request.url)
    const hotelId = searchParams.get('id')

    if (!hotelId) {
      return NextResponse.json(
        { error: 'Hotel ID is required' },
        { status: 400 }
      )
    }

    // Check if user owns this hotel
    const { data: hotel, error: fetchError } = await supabase
      .from('hotels')
      .select('id, is_primary')
      .eq('id', hotelId)
      .eq('user_id', session.user.id)
      .single()

    if (fetchError || !hotel) {
      return NextResponse.json(
        { error: 'Hotel not found or you do not have permission to delete it' },
        { status: 404 }
      )
    }

    // Check if this is the user's only hotel
    const { count } = await supabase
      .from('hotels')
      .select('id', { count: 'exact' })
      .eq('user_id', session.user.id)

    if (count === 1) {
      return NextResponse.json(
        { error: 'Cannot delete your only hotel. You must have at least one hotel.' },
        { status: 400 }
      )
    }

    // If deleting primary hotel, set another hotel as primary
    if (hotel.is_primary) {
      const { data: otherHotels } = await supabase
        .from('hotels')
        .select('id')
        .eq('user_id', session.user.id)
        .neq('id', hotelId)
        .order('display_order', { ascending: true })
        .limit(1)

      if (otherHotels && otherHotels.length > 0) {
        await supabase
          .from('hotels')
          .update({ is_primary: true })
          .eq('id', otherHotels[0].id)
      }
    }

    // Delete the hotel
    const { error: deleteError } = await supabase
      .from('hotels')
      .delete()
      .eq('id', hotelId)
      .eq('user_id', session.user.id)

    if (deleteError) {
      console.error('Error deleting hotel:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete hotel' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Hotel deleted successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}