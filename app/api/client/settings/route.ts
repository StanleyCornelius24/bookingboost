import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Check auth
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the user's hotel with all marketing-related fields
    const { data: hotel, error } = await supabase
      .from('hotels')
      .select(`
        id,
        google_analytics_property_id,
        google_ads_customer_id,
        google_ads_manager_id,
        meta_ad_account_id,
        last_marketing_sync
      `)
      .eq('user_id', session.user.id)
      .single()

    if (error || !hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })
    }

    // Check if Google and Meta are connected
    const { data: googleToken } = await supabase
      .from('api_tokens')
      .select('id')
      .eq('hotel_id', hotel.id)
      .eq('service', 'google')
      .maybeSingle()

    const { data: metaToken } = await supabase
      .from('api_tokens')
      .select('id')
      .eq('hotel_id', hotel.id)
      .eq('service', 'meta')
      .maybeSingle()

    return NextResponse.json({
      ...hotel,
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
    const supabase = await createServerClient()

    // Check auth
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the user's hotel ID
    const { data: hotel } = await supabase
      .from('hotels')
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })
    }

    // Parse the request body
    const body = await request.json()
    const {
      google_analytics_property_id,
      google_ads_customer_id,
      google_ads_manager_id,
      meta_ad_account_id
    } = body

    // Update the hotel record
    const { error: updateError } = await supabase
      .from('hotels')
      .update({
        google_analytics_property_id,
        google_ads_customer_id,
        google_ads_manager_id,
        meta_ad_account_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', hotel.id)

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
