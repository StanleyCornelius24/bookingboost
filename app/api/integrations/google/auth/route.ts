import { google } from 'googleapis'
import { NextRequest, NextResponse } from 'next/server'
import { getSelectedHotel } from '@/lib/get-selected-hotel'

export async function GET(request: NextRequest) {
  try {
    // Validate environment variables
    if (!process.env.GOOGLE_CLIENT_ID) {
      return NextResponse.json({ error: 'Google Client ID not configured' }, { status: 500 })
    }
    if (!process.env.GOOGLE_CLIENT_SECRET) {
      return NextResponse.json({ error: 'Google Client Secret not configured' }, { status: 500 })
    }
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      return NextResponse.json({ error: 'App URL not configured' }, { status: 500 })
    }

    // Get selected hotel ID from query parameter
    const { searchParams } = new URL(request.url)
    const selectedHotelId = searchParams.get('hotelId')

    // Get the hotel (selected or fallback to primary)
    const { hotel, error: hotelError, status } = await getSelectedHotel(selectedHotelId, 'id')

    if (hotelError || !hotel) {
      return NextResponse.json({ error: hotelError || 'Hotel not found' }, { status })
    }

    const hotelRecord = hotel as unknown as { id: string }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/callback`

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    )

    // Generate the URL with the scopes we need
    const scopes = [
      'https://www.googleapis.com/auth/analytics.readonly',
      'https://www.googleapis.com/auth/adwords',
      'https://www.googleapis.com/auth/business.manage',
      'https://www.googleapis.com/auth/userinfo.email'
    ]

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent', // Force consent screen to always get a refresh token
      scope: scopes,
      state: hotelRecord.id // Pass hotel ID to identify which hotel this is for
    })

    console.log('Generated Google auth URL:', authUrl)
    console.log('Redirect URI:', redirectUri)

    return NextResponse.json({ authUrl })

  } catch (error) {
    console.error('Google auth error:', error)
    return NextResponse.json(
      { error: 'Failed to generate auth URL', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}