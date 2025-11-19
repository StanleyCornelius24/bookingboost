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
      console.log('Google Ads Developer Token not configured, returning mock data')

      const mockCampaignData = [
        {
          campaignName: 'Hotel Booking Campaign',
          campaignId: '12345',
          date: startDate,
          impressions: 1250,
          clicks: 45,
          cost: 67.50,
          conversions: 3,
          conversionsValue: 450.00
        },
        {
          campaignName: 'Hotel Booking Campaign',
          campaignId: '12345',
          date: endDate,
          impressions: 1180,
          clicks: 52,
          cost: 78.20,
          conversions: 4,
          conversionsValue: 600.00
        }
      ]

      const mockDailyData = mockCampaignData.reduce((acc: Record<string, any>, row) => {
        const date = row.date
        if (!acc[date]) {
          acc[date] = {
            date,
            impressions: 0,
            clicks: 0,
            cost: 0,
            conversions: 0,
            conversionsValue: 0
          }
        }
        acc[date].impressions += row.impressions
        acc[date].clicks += row.clicks
        acc[date].cost += row.cost
        acc[date].conversions += row.conversions
        acc[date].conversionsValue += row.conversionsValue
        return acc
      }, {})

      const mockAggregatedData = Object.values(mockDailyData)

      return NextResponse.json({
        campaigns: mockCampaignData,
        daily: mockAggregatedData,
        summary: {
          totalSpend: mockAggregatedData.reduce((sum: number, day: any) => sum + day.cost, 0),
          totalClicks: mockAggregatedData.reduce((sum: number, day: any) => sum + day.clicks, 0),
          totalImpressions: mockAggregatedData.reduce((sum: number, day: any) => sum + day.impressions, 0),
          totalConversions: mockAggregatedData.reduce((sum: number, day: any) => sum + day.conversions, 0),
          currency: 'ZAR'
        },
        currency: 'ZAR',
        note: 'Mock data - Configure GOOGLE_ADS_DEVELOPER_TOKEN for real data. For MCC accounts, also set google_ads_manager_id in hotel settings.'
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

    // First, get account currency
    const customerQuery = `
      SELECT
        customer.currency_code
      FROM customer
      WHERE customer.id = '${adsCustomerId.replace(/-/g, '')}'
    `

    const customerResponse = await customer.query(customerQuery)
    const accountCurrency = customerResponse[0]?.customer?.currency_code || 'USD'

    // Query for campaign performance data
    const query = `
      SELECT
        campaign.name,
        campaign.id,
        segments.date,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value
      FROM campaign
      WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
      AND campaign.status = 'ENABLED'
      ORDER BY segments.date DESC
    `

    const response = await customer.query(query)

    const campaignData = response.map((result: any) => ({
      campaignName: result.campaign?.name,
      campaignId: result.campaign?.id,
      date: result.segments?.date,
      impressions: parseInt(result.metrics?.impressions || '0'),
      clicks: parseInt(result.metrics?.clicks || '0'),
      cost: (parseInt(result.metrics?.cost_micros || '0')) / 1000000, // Convert from micros
      conversions: parseFloat(result.metrics?.conversions || '0'),
      conversionsValue: (parseInt(result.metrics?.conversions_value || '0')) / 1000000
    }))

    // Aggregate data by date
    const dailyData = campaignData.reduce((acc: any, row: any) => {
      const date = row.date
      if (!acc[date]) {
        acc[date] = {
          date,
          impressions: 0,
          clicks: 0,
          cost: 0,
          conversions: 0,
          conversionsValue: 0
        }
      }
      acc[date].impressions += row.impressions
      acc[date].clicks += row.clicks
      acc[date].cost += row.cost
      acc[date].conversions += row.conversions
      acc[date].conversionsValue += row.conversionsValue
      return acc
    }, {})

    const aggregatedData = Object.values(dailyData)

    // Store the data in our database
    for (const dayData of aggregatedData as any[]) {
      await supabase
        .from('marketing_metrics')
        .upsert([
          {
            hotel_id: hotel.id,
            date: dayData.date,
            source: 'google_ads',
            metric_type: 'spend',
            value: dayData.cost
          },
          {
            hotel_id: hotel.id,
            date: dayData.date,
            source: 'google_ads',
            metric_type: 'clicks',
            value: dayData.clicks
          },
          {
            hotel_id: hotel.id,
            date: dayData.date,
            source: 'google_ads',
            metric_type: 'impressions',
            value: dayData.impressions
          },
          {
            hotel_id: hotel.id,
            date: dayData.date,
            source: 'google_ads',
            metric_type: 'conversions',
            value: dayData.conversions
          }
        ], {
          onConflict: 'hotel_id,date,source,metric_type'
        })
    }

    return NextResponse.json({
      campaigns: campaignData,
      daily: aggregatedData,
      summary: {
        totalSpend: aggregatedData.reduce((sum: number, day: any) => sum + day.cost, 0),
        totalClicks: aggregatedData.reduce((sum: number, day: any) => sum + day.clicks, 0),
        totalImpressions: aggregatedData.reduce((sum: number, day: any) => sum + day.impressions, 0),
        totalConversions: aggregatedData.reduce((sum: number, day: any) => sum + day.conversions, 0),
        currency: accountCurrency
      },
      currency: accountCurrency
    })

  } catch (error) {
    console.error('Google Ads API error:', error)
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
      { error: 'Failed to fetch Google Ads data', details: errorMessage },
      { status: 500 }
    )
  }
}