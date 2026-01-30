import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getSelectedHotel } from '@/lib/get-selected-hotel'

export async function GET(request: NextRequest) {
  try {
    console.log('[Settings GET] Request received')

    // Get selected hotel ID from query parameter
    const { searchParams } = new URL(request.url)
    const selectedHotelId = searchParams.get('hotelId')

    // Get the hotel (selected or fallback to primary)
    const { hotel, error, status } = await getSelectedHotel(
      selectedHotelId,
      'id, website, google_analytics_property_id, google_ads_customer_id, google_ads_manager_id, google_my_business_location_id, meta_ad_account_id, last_settings_sync'
    )

    if (error || !hotel) {
      console.error('Settings GET - Hotel lookup failed:', error)
      return NextResponse.json({ error: error || 'Hotel not found' }, { status })
    }

    const hotelRecord = hotel as unknown as { id: string; website?: string; google_analytics_property_id?: string; google_ads_customer_id?: string; google_ads_manager_id?: string; google_my_business_location_id?: string; meta_ad_account_id?: string; last_settings_sync?: string }
    const supabase = await createServerClient()

    // Check if Google and Meta are connected
    const { data: googleToken } = await supabase
      .from('api_tokens')
      .select('id')
      .eq('hotel_id', hotelRecord.id)
      .eq('service', 'google')
      .maybeSingle()

    const { data: metaToken } = await supabase
      .from('api_tokens')
      .select('id')
      .eq('hotel_id', hotelRecord.id)
      .eq('service', 'meta')
      .maybeSingle()

    return NextResponse.json({
      ...hotelRecord,
      google_connected: !!googleToken,
      meta_connected: !!metaToken
    })

  } catch (error) {
    console.error('Client settings API GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get selected hotel ID from query parameter
    const { searchParams } = new URL(request.url)
    const selectedHotelId = searchParams.get('hotelId')

    // Get the hotel (selected or fallback to primary)
    const { hotel, error, status } = await getSelectedHotel(selectedHotelId, 'id')

    if (error || !hotel) {
      return NextResponse.json({ error: error || 'Hotel not found' }, { status })
    }

    const hotelRecord = hotel as unknown as { id: string }
    const supabase = await createServerClient()

    // Parse the request body
    const body = await request.json()
    const {
      website,
      google_analytics_property_id,
      google_ads_customer_id,
      google_ads_manager_id,
      google_my_business_location_id,
      meta_ad_account_id
    } = body

    // Update the hotel record
    const now = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('hotels')
      .update({
        website,
        google_analytics_property_id,
        google_ads_customer_id,
        google_ads_manager_id,
        google_my_business_location_id,
        meta_ad_account_id,
        updated_at: now,
        last_settings_sync: now
      })
      .eq('id', hotelRecord.id)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Client settings API PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
