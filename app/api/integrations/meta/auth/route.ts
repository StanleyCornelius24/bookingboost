import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getSelectedHotel } from '@/lib/get-selected-hotel'

export async function GET(request: NextRequest) {
  try {
    // Validate environment variables
    if (!process.env.META_APP_ID) {
      return NextResponse.json({ error: 'Meta App ID not configured' }, { status: 500 })
    }
    if (!process.env.META_APP_SECRET) {
      return NextResponse.json({ error: 'Meta App Secret not configured' }, { status: 500 })
    }
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      return NextResponse.json({ error: 'App URL not configured' }, { status: 500 })
    }

    // Get selected hotel ID from query parameter
    const { searchParams } = new URL(request.url)
    const selectedHotelId = searchParams.get('hotelId')

    const supabase = await createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the hotel (selected or fallback to primary)
    const { hotel, error: hotelError, status } = await getSelectedHotel(selectedHotelId, 'id')

    if (hotelError || !hotel) {
      return NextResponse.json({ error: hotelError || 'Hotel not found' }, { status })
    }

    const hotelRecord = hotel as unknown as { id: string }

    const scopes = [
      'ads_read',
      'business_management',
      'pages_read_engagement'
    ].join(',')

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/meta/callback`

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${process.env.META_APP_ID}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${scopes}&` +
      `state=${hotelRecord.id}&` +
      `response_type=code`

    console.log('Generated Meta auth URL:', authUrl)
    console.log('Meta App ID:', process.env.META_APP_ID)
    console.log('Redirect URI:', redirectUri)

    return NextResponse.json({ authUrl })

  } catch (error) {
    console.error('Meta auth error:', error)
    return NextResponse.json(
      { error: 'Failed to generate auth URL', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}