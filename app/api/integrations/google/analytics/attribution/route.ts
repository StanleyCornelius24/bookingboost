import { google } from 'googleapis'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getGoogleApiTokens } from '@/lib/get-google-tokens'
import { getSelectedHotel } from '@/lib/get-selected-hotel'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const selectedHotelId = searchParams.get('hotelId')

    const supabase = await createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the hotel (selected or fallback to primary)
    const { hotel, error: hotelError, status } = await getSelectedHotel(selectedHotelId, 'id, google_analytics_property_id')

    if (hotelError || !hotel) {
      return NextResponse.json({ error: hotelError || 'Hotel not found' }, { status })
    }

    const hotelRecord = hotel as unknown as { id: string; google_analytics_property_id: string | null }

    // Get API token with fallback to admin tokens when impersonating
    const apiToken = await getGoogleApiTokens(hotelRecord.id, session)

    if (!apiToken) {
      return NextResponse.json({ error: 'Google account not connected' }, { status: 404 })
    }

    // Set up Google Analytics client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    )

    oauth2Client.setCredentials({
      access_token: apiToken.access_token,
      refresh_token: apiToken.refresh_token,
    })

    const analyticsAdmin = google.analyticsadmin({ version: 'v1beta', auth: oauth2Client })

    const analyticsPropertyId = hotelRecord.google_analytics_property_id?.toString()

    if (!analyticsPropertyId) {
      return NextResponse.json({ error: 'Analytics property ID not configured' }, { status: 400 })
    }

    try {
      // Fetch attribution settings
      // Type assertion needed as getAttributionSettings may not be in current types
      const response = await (analyticsAdmin.properties as any).getAttributionSettings({
        name: `properties/${analyticsPropertyId}/attributionSettings`
      })

      const acquisitionConversionEventLookbackWindow = response.data.acquisitionConversionEventLookbackWindow
      const otherConversionEventLookbackWindow = response.data.otherConversionEventLookbackWindow
      const reportingAttributionModel = response.data.reportingAttributionModel

      // Map the attribution model to a friendly name
      const attributionModelNames: { [key: string]: string } = {
        'CROSS_CHANNEL_DATA_DRIVEN': 'Data-driven',
        'CROSS_CHANNEL_LAST_CLICK': 'Last click',
        'CROSS_CHANNEL_FIRST_CLICK': 'First click',
        'CROSS_CHANNEL_LINEAR': 'Linear',
        'CROSS_CHANNEL_POSITION_BASED': 'Position-based',
        'CROSS_CHANNEL_TIME_DECAY': 'Time decay',
        'ADS_PREFERRED_LAST_CLICK': 'Ads-preferred last click'
      }

      return NextResponse.json({
        attributionModel: attributionModelNames[reportingAttributionModel || ''] || reportingAttributionModel || 'Unknown',
        acquisitionLookbackDays: acquisitionConversionEventLookbackWindow || 'Not set',
        otherLookbackDays: otherConversionEventLookbackWindow || 'Not set'
      })
    } catch (adminError: any) {
      console.error('GA4 Admin API error:', adminError)
      // If we can't fetch the attribution settings, return a default message
      return NextResponse.json({
        attributionModel: 'Default (Data-driven or Last click)',
        note: 'Unable to fetch specific attribution settings'
      })
    }

  } catch (error) {
    console.error('Google Analytics attribution API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attribution settings' },
      { status: 500 }
    )
  }
}
