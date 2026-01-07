import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { google } from 'googleapis'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') || '30daysAgo'
    const endDate = searchParams.get('endDate') || 'today'

    const supabase = await createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check for impersonation
    const cookieStore = await cookies()
    const impersonateUserId = cookieStore.get('impersonate_user_id')?.value
    const userId = impersonateUserId || session.user.id

    // Get hotel and API token
    const { data: hotel } = await supabase
      .from('hotels')
      .select('id, google_analytics_property_id')
      .eq('user_id', userId)
      .single()

    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })
    }

    const { data: apiToken } = await supabase
      .from('api_tokens')
      .select('*')
      .eq('hotel_id', hotel.id)
      .eq('service', 'google')
      .single()

    if (!apiToken) {
      return NextResponse.json({ error: 'Google account not connected' }, { status: 404 })
    }

    // Set up Google clients
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    )

    oauth2Client.setCredentials({
      access_token: apiToken.access_token,
      refresh_token: apiToken.refresh_token,
    })

    const analyticsData = google.analyticsdata({ version: 'v1beta', auth: oauth2Client })
    const searchConsole = google.searchconsole({ version: 'v1', auth: oauth2Client })

    const analyticsPropertyId = hotel.google_analytics_property_id?.toString()

    if (!analyticsPropertyId) {
      return NextResponse.json({ error: 'Analytics property ID not configured' }, { status: 400 })
    }

    // Get organic search traffic from GA4
    const organicTrafficResponse = await analyticsData.properties.runReport({
      property: `properties/${analyticsPropertyId}`,
      requestBody: {
        dateRanges: [{
          startDate,
          endDate
        }],
        metrics: [
          { name: 'sessions' },
          { name: 'activeUsers' },
          { name: 'engagedSessions' },
          { name: 'conversions' },
          { name: 'totalRevenue' }
        ],
        dimensionFilter: {
          filter: {
            fieldName: 'sessionDefaultChannelGrouping',
            stringFilter: {
              matchType: 'EXACT',
              value: 'Organic Search'
            }
          }
        }
      }
    })

    const organicData = organicTrafficResponse.data.rows?.[0] || null
    const sessions = parseInt(organicData?.metricValues?.[0]?.value || '0')
    const engagedSessions = parseInt(organicData?.metricValues?.[2]?.value || '0')

    const organicTraffic = {
      sessions,
      users: parseInt(organicData?.metricValues?.[1]?.value || '0'),
      engagedSessions,
      conversions: parseInt(organicData?.metricValues?.[3]?.value || '0'),
      revenue: parseFloat(organicData?.metricValues?.[4]?.value || '0'),
      engagementRate: sessions > 0 ? (engagedSessions / sessions) * 100 : 0
    }

    // Get organic traffic by source
    const organicSourcesResponse = await analyticsData.properties.runReport({
      property: `properties/${analyticsPropertyId}`,
      requestBody: {
        dateRanges: [{
          startDate,
          endDate
        }],
        metrics: [
          { name: 'sessions' },
          { name: 'activeUsers' },
          { name: 'conversions' }
        ],
        dimensions: [
          { name: 'sessionSource' }
        ],
        dimensionFilter: {
          filter: {
            fieldName: 'sessionDefaultChannelGrouping',
            stringFilter: {
              matchType: 'EXACT',
              value: 'Organic Search'
            }
          }
        },
        orderBys: [{
          metric: { metricName: 'sessions' },
          desc: true
        }],
        limit: '10'
      }
    })

    const organicSources = organicSourcesResponse.data.rows?.map(row => ({
      source: row.dimensionValues?.[0]?.value || 'Unknown',
      sessions: parseInt(row.metricValues?.[0]?.value || '0'),
      users: parseInt(row.metricValues?.[1]?.value || '0'),
      conversions: parseInt(row.metricValues?.[2]?.value || '0')
    })) || []

    // Try to get Search Console data
    let searchConsoleData = null
    try {
      // Get the website URL from GA4 or use a stored value
      // For now, we'll try to fetch Search Console sites
      const sitesResponse = await searchConsole.sites.list()
      const sites = sitesResponse.data.siteEntry || []

      if (sites.length > 0) {
        // Use the first site (you may want to store this in the database)
        const siteUrl = sites[0].siteUrl

        if (!siteUrl) {
          throw new Error('Site URL not found')
        }

        // Convert date format for Search Console (YYYY-MM-DD)
        const scStartDate = startDate === '30daysAgo'
          ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          : startDate
        const scEndDate = endDate === 'today'
          ? new Date().toISOString().split('T')[0]
          : endDate

        const scResponse = await searchConsole.searchanalytics.query({
          siteUrl,
          requestBody: {
            startDate: scStartDate,
            endDate: scEndDate,
            dimensions: [],
            rowLimit: 1
          }
        })

        const scRow = scResponse.data.rows?.[0] || null
        searchConsoleData = {
          impressions: scRow?.impressions || 0,
          clicks: scRow?.clicks || 0,
          ctr: scRow?.ctr || 0,
          position: scRow?.position || 0,
          connected: true
        }
      }
    } catch (scError) {
      console.error('Search Console error:', scError)
      searchConsoleData = {
        impressions: 0,
        clicks: 0,
        ctr: 0,
        position: 0,
        connected: false
      }
    }

    return NextResponse.json({
      organicTraffic,
      organicSources,
      searchConsole: searchConsoleData,
      hasData: organicTraffic.sessions > 0 || (searchConsoleData?.impressions || 0) > 0
    })

  } catch (error) {
    console.error('SEO API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch SEO data' },
      { status: 500 }
    )
  }
}
