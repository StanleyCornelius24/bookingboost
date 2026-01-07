import { google } from 'googleapis'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { getGoogleApiTokens } from '@/lib/get-google-tokens'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') || '30daysAgo'
    const endDate = searchParams.get('endDate') || 'today'
    const propertyId = searchParams.get('propertyId')

    const supabase = await createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check for impersonation
    const cookieStore = await cookies()
    const impersonateUserId = cookieStore.get('impersonate_user_id')?.value
    const userId = impersonateUserId || session.user.id

    // Get hotel
    const { data: hotel } = await supabase
      .from('hotels')
      .select('id, google_analytics_property_id')
      .eq('user_id', userId)
      .single()

    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })
    }

    // Get API token with fallback to admin tokens when impersonating
    const apiToken = await getGoogleApiTokens(hotel.id, session)

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

    const analyticsPropertyId = propertyId || hotel.google_analytics_property_id

    if (!analyticsPropertyId) {
      return NextResponse.json({ error: 'Analytics property ID not configured' }, { status: 400 })
    }

    // Fetch key metrics
    const response = await analyticsData.properties.runReport({
      property: `properties/${analyticsPropertyId}`,
      requestBody: {
        dateRanges: [{
          startDate,
          endDate
        }],
        metrics: [
          { name: 'sessions' },
          { name: 'activeUsers' },
          { name: 'screenPageViews' },
          { name: 'engagedSessions' },
          { name: 'averageSessionDuration' },
          { name: 'conversions' }
        ],
        dimensions: [
          { name: 'date' }
        ]
      }
    })

    // Also get traffic sources
    const sourceResponse = await analyticsData.properties.runReport({
      property: `properties/${analyticsPropertyId}`,
      requestBody: {
        dateRanges: [{
          startDate,
          endDate
        }],
        metrics: [
          { name: 'sessions' },
          { name: 'activeUsers' },
          { name: 'conversions' },
          { name: 'totalRevenue' },
          { name: 'advertiserAdCost' }
        ],
        dimensions: [
          { name: 'sessionDefaultChannelGrouping' }
        ]
      }
    })

    // Get device category data
    const deviceResponse = await analyticsData.properties.runReport({
      property: `properties/${analyticsPropertyId}`,
      requestBody: {
        dateRanges: [{
          startDate,
          endDate
        }],
        metrics: [
          { name: 'sessions' },
          { name: 'activeUsers' }
        ],
        dimensions: [
          { name: 'deviceCategory' }
        ]
      }
    })

    // Get top 10 countries
    const countryResponse = await analyticsData.properties.runReport({
      property: `properties/${analyticsPropertyId}`,
      requestBody: {
        dateRanges: [{
          startDate,
          endDate
        }],
        metrics: [
          { name: 'sessions' },
          { name: 'activeUsers' },
          { name: 'conversions' },
          { name: 'totalRevenue' }
        ],
        dimensions: [
          { name: 'country' }
        ],
        orderBys: [
          {
            metric: {
              metricName: 'sessions'
            },
            desc: true
          }
        ],
        limit: '10'
      }
    })

    const data = {
      overview: response.data.rows?.map(row => {
        const dateString = row.dimensionValues?.[0]?.value || ''
        // Convert YYYYMMDD to YYYY-MM-DD format
        const formattedDate = dateString.length === 8
          ? `${dateString.substring(0, 4)}-${dateString.substring(4, 6)}-${dateString.substring(6, 8)}`
          : dateString

        return {
          date: formattedDate,
          sessions: parseInt(row.metricValues?.[0]?.value || '0'),
          users: parseInt(row.metricValues?.[1]?.value || '0'),
          pageviews: parseInt(row.metricValues?.[2]?.value || '0'),
          engagedSessions: parseInt(row.metricValues?.[3]?.value || '0'),
          avgSessionDuration: parseFloat(row.metricValues?.[4]?.value || '0'),
          conversions: parseInt(row.metricValues?.[5]?.value || '0')
        }
      }) || [],
      trafficSources: sourceResponse.data.rows?.map(row => ({
        source: row.dimensionValues?.[0]?.value,
        sessions: parseInt(row.metricValues?.[0]?.value || '0'),
        users: parseInt(row.metricValues?.[1]?.value || '0'),
        conversions: parseInt(row.metricValues?.[2]?.value || '0'),
        revenue: parseFloat(row.metricValues?.[3]?.value || '0'),
        cost: parseFloat(row.metricValues?.[4]?.value || '0')
      })) || [],
      devices: deviceResponse.data.rows?.map(row => ({
        device: row.dimensionValues?.[0]?.value,
        sessions: parseInt(row.metricValues?.[0]?.value || '0'),
        users: parseInt(row.metricValues?.[1]?.value || '0')
      })) || [],
      topCountries: countryResponse.data.rows?.map(row => ({
        country: row.dimensionValues?.[0]?.value,
        sessions: parseInt(row.metricValues?.[0]?.value || '0'),
        users: parseInt(row.metricValues?.[1]?.value || '0'),
        conversions: parseInt(row.metricValues?.[2]?.value || '0'),
        revenue: parseFloat(row.metricValues?.[3]?.value || '0')
      })) || []
    }

    // Store the data in our database for historical tracking
    for (const dayData of data.overview) {
      await supabase
        .from('marketing_metrics')
        .upsert({
          hotel_id: hotel.id,
          date: dayData.date,
          source: 'google_analytics',
          metric_type: 'sessions',
          value: dayData.sessions
        }, {
          onConflict: 'hotel_id,date,source,metric_type'
        })
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Google Analytics API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Analytics data' },
      { status: 500 }
    )
  }
}