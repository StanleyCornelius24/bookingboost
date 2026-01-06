import { GoogleAdsApi } from 'google-ads-api'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') || '2023-01-01'
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0]
    const customerId = searchParams.get('customerId')
    const loginCustomerId = searchParams.get('loginCustomerId')

    const supabase = await createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get hotel and API token
    const { data: hotel } = await supabase
      .from('hotels')
      .select('id, google_ads_customer_id, google_ads_manager_id')
      .eq('user_id', session.user.id)
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

    const adsCustomerId = customerId || hotel.google_ads_customer_id
    const managerCustomerId = loginCustomerId || hotel.google_ads_manager_id

    if (!adsCustomerId) {
      return NextResponse.json({ error: 'Google Ads customer ID not configured' }, { status: 400 })
    }

    // Check if Google Ads Developer Token is available
    if (!process.env.GOOGLE_ADS_DEVELOPER_TOKEN) {
      // Return mock data if developer token is not available
      console.log('Google Ads Developer Token not configured, returning mock keyword data')

      const mockKeywordData = [
        {
          keyword: 'luxury hotel booking',
          impressions: 5420,
          clicks: 245,
          conversions: 12,
          cost: 1250.50
        },
        {
          keyword: 'boutique hotel near me',
          impressions: 4180,
          clicks: 198,
          conversions: 8,
          cost: 980.25
        },
        {
          keyword: 'best hotel deals',
          impressions: 3890,
          clicks: 187,
          conversions: 10,
          cost: 875.00
        },
        {
          keyword: 'hotel accommodation',
          impressions: 3245,
          clicks: 156,
          conversions: 6,
          cost: 720.50
        },
        {
          keyword: 'weekend hotel getaway',
          impressions: 2890,
          clicks: 142,
          conversions: 9,
          cost: 650.75
        },
        {
          keyword: 'business hotel',
          impressions: 2567,
          clicks: 128,
          conversions: 5,
          cost: 580.00
        },
        {
          keyword: 'romantic hotel',
          impressions: 2345,
          clicks: 115,
          conversions: 7,
          cost: 520.25
        },
        {
          keyword: 'family hotel',
          impressions: 2123,
          clicks: 98,
          conversions: 4,
          cost: 445.50
        },
        {
          keyword: 'pet friendly hotel',
          impressions: 1987,
          clicks: 89,
          conversions: 3,
          cost: 398.75
        },
        {
          keyword: 'spa hotel',
          impressions: 1756,
          clicks: 82,
          conversions: 5,
          cost: 365.00
        },
        {
          keyword: 'beachfront hotel',
          impressions: 1654,
          clicks: 76,
          conversions: 4,
          cost: 342.50
        },
        {
          keyword: 'city center hotel',
          impressions: 1543,
          clicks: 71,
          conversions: 3,
          cost: 315.75
        },
        {
          keyword: 'airport hotel',
          impressions: 1432,
          clicks: 65,
          conversions: 2,
          cost: 287.00
        },
        {
          keyword: 'hotel with pool',
          impressions: 1321,
          clicks: 59,
          conversions: 3,
          cost: 264.25
        },
        {
          keyword: 'budget hotel',
          impressions: 1245,
          clicks: 54,
          conversions: 2,
          cost: 238.50
        },
        {
          keyword: 'hotel breakfast included',
          impressions: 1167,
          clicks: 48,
          conversions: 2,
          cost: 215.75
        },
        {
          keyword: 'downtown hotel',
          impressions: 1089,
          clicks: 43,
          conversions: 1,
          cost: 192.00
        },
        {
          keyword: 'hotel parking',
          impressions: 1012,
          clicks: 38,
          conversions: 1,
          cost: 168.25
        },
        {
          keyword: 'hotel wifi',
          impressions: 934,
          clicks: 34,
          conversions: 1,
          cost: 145.50
        },
        {
          keyword: 'hotel gym',
          impressions: 867,
          clicks: 29,
          conversions: 1,
          cost: 122.75
        }
      ]

      return NextResponse.json({
        keywords: mockKeywordData,
        note: 'Mock data - Configure GOOGLE_ADS_DEVELOPER_TOKEN for real data.'
      })
    }

    // Validate required environment variables
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return NextResponse.json({ error: 'Google API credentials not configured' }, { status: 500 })
    }

    // Initialize Google Ads API client
    const client = new GoogleAdsApi({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
    })

    // Create customer instance with MCC support
    const customerConfig: any = {
      customer_id: adsCustomerId.replace(/-/g, ''), // Remove dashes
      refresh_token: apiToken.refresh_token,
    }

    // Add login_customer_id if using MCC account
    if (managerCustomerId) {
      customerConfig.login_customer_id = managerCustomerId.replace(/-/g, '')
    }

    const customer = client.Customer(customerConfig)

    // Query for keyword performance data
    const query = `
      SELECT
        ad_group_criterion.keyword.text,
        metrics.impressions,
        metrics.clicks,
        metrics.conversions,
        metrics.cost_micros
      FROM keyword_view
      WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
      AND ad_group_criterion.status = 'ENABLED'
      AND campaign.status = 'ENABLED'
      ORDER BY metrics.clicks DESC
      LIMIT 20
    `

    const response = await customer.query(query)

    const keywordData = response.map((result: any) => ({
      keyword: result.ad_group_criterion?.keyword?.text || 'Unknown',
      impressions: parseInt(result.metrics?.impressions || '0'),
      clicks: parseInt(result.metrics?.clicks || '0'),
      conversions: parseFloat(result.metrics?.conversions || '0'),
      cost: (parseInt(result.metrics?.cost_micros || '0')) / 1000000 // Convert from micros
    }))

    return NextResponse.json({
      keywords: keywordData
    })

  } catch (error) {
    console.error('Google Ads Keywords API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Provide helpful guidance for common MCC account errors
    if (errorMessage.includes('User doesn\'t have permission to access customer') ||
        errorMessage.includes('login-customer-id')) {
      return NextResponse.json({
        error: 'Google Ads access denied',
        details: 'If using an MCC account, please provide the Manager Customer ID via loginCustomerId parameter or configure google_ads_manager_id in hotel settings.',
        originalError: errorMessage
      }, { status: 403 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch Google Ads keyword data', details: errorMessage },
      { status: 500 }
    )
  }
}
