import { google } from 'googleapis'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getGoogleApiTokens } from '@/lib/get-google-tokens'
import { getSelectedHotel } from '@/lib/get-selected-hotel'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') || '30daysAgo'
    const endDate = searchParams.get('endDate') || 'today'
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

    const analyticsData = google.analyticsdata({ version: 'v1beta', auth: oauth2Client })

    const analyticsPropertyId = hotelRecord.google_analytics_property_id?.toString()

    if (!analyticsPropertyId) {
      return NextResponse.json({ error: 'Analytics property ID not configured' }, { status: 400 })
    }

    // Fetch conversions by event name
    const response = await analyticsData.properties.runReport({
      property: `properties/${analyticsPropertyId}`,
      requestBody: {
        dateRanges: [{
          startDate,
          endDate
        }],
        metrics: [
          { name: 'conversions' },
          { name: 'eventCount' }
        ],
        dimensions: [
          { name: 'eventName' }
        ],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            stringFilter: {
              matchType: 'CONTAINS',
              value: '',
              caseSensitive: false
            }
          }
        },
        orderBys: [
          {
            metric: {
              metricName: 'conversions'
            },
            desc: true
          }
        ],
        limit: '50'
      }
    })

    const conversions = response.data.rows
      ?.map(row => ({
        eventName: row.dimensionValues?.[0]?.value || 'Unknown',
        conversions: parseInt(row.metricValues?.[0]?.value || '0'),
        eventCount: parseInt(row.metricValues?.[1]?.value || '0')
      }))
      .filter(conversion => conversion.conversions > 0) || []

    return NextResponse.json({
      conversions,
      total: conversions.reduce((sum, c) => sum + c.conversions, 0)
    })

  } catch (error) {
    console.error('Google Analytics Conversions API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversions data' },
      { status: 500 }
    )
  }
}
