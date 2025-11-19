import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') || '2023-01-01'
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0]
    const adAccountId = searchParams.get('adAccountId')

    const supabase = await createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get hotel and API token
    const { data: hotel } = await supabase
      .from('hotels')
      .select('id, meta_ad_account_id')
      .eq('user_id', session.user.id)
      .single()

    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })
    }

    const { data: apiToken } = await supabase
      .from('api_tokens')
      .select('*')
      .eq('hotel_id', hotel.id)
      .eq('service', 'meta')
      .single()

    if (!apiToken) {
      return NextResponse.json({ error: 'Meta account not connected' }, { status: 404 })
    }

    const metaAdAccountId = adAccountId || hotel.meta_ad_account_id

    if (!metaAdAccountId) {
      return NextResponse.json({ error: 'Meta Ad Account ID not configured' }, { status: 400 })
    }

    // Fetch insights from Meta Marketing API
    const fields = [
      'campaign_name',
      'date_start',
      'date_stop',
      'impressions',
      'clicks',
      'spend',
      'actions',
      'action_values'
    ].join(',')

    const insightsUrl = `https://graph.facebook.com/v18.0/act_${metaAdAccountId}/insights` +
      `?fields=${fields}` +
      `&time_range={"since":"${startDate}","until":"${endDate}"}` +
      `&time_increment=1` +
      `&level=campaign` +
      `&access_token=${apiToken.access_token}`

    const response = await fetch(insightsUrl)
    const data = await response.json()

    if (data.error) {
      console.error('Meta API error:', data.error)
      return NextResponse.json({ error: data.error.message }, { status: 400 })
    }

    const campaignData = data.data?.map((campaign: any) => {
      // Extract conversions from actions array
      const conversions = campaign.actions?.find((action: any) =>
        action.action_type === 'purchase' || action.action_type === 'complete_registration'
      )?.value || 0

      const conversionValue = campaign.action_values?.find((action: any) =>
        action.action_type === 'purchase' || action.action_type === 'complete_registration'
      )?.value || 0

      return {
        campaignName: campaign.campaign_name,
        date: campaign.date_start,
        impressions: parseInt(campaign.impressions || '0'),
        clicks: parseInt(campaign.clicks || '0'),
        spend: parseFloat(campaign.spend || '0'),
        conversions: parseInt(conversions),
        conversionValue: parseFloat(conversionValue)
      }
    }) || []

    // Aggregate data by date
    const dailyData = campaignData.reduce((acc: any, row: any) => {
      const date = row.date
      if (!acc[date]) {
        acc[date] = {
          date,
          impressions: 0,
          clicks: 0,
          spend: 0,
          conversions: 0,
          conversionValue: 0
        }
      }
      acc[date].impressions += row.impressions
      acc[date].clicks += row.clicks
      acc[date].spend += row.spend
      acc[date].conversions += row.conversions
      acc[date].conversionValue += row.conversionValue
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
            source: 'meta_ads',
            metric_type: 'spend',
            value: dayData.spend
          },
          {
            hotel_id: hotel.id,
            date: dayData.date,
            source: 'meta_ads',
            metric_type: 'clicks',
            value: dayData.clicks
          },
          {
            hotel_id: hotel.id,
            date: dayData.date,
            source: 'meta_ads',
            metric_type: 'impressions',
            value: dayData.impressions
          },
          {
            hotel_id: hotel.id,
            date: dayData.date,
            source: 'meta_ads',
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
        totalSpend: aggregatedData.reduce((sum: number, day: any) => sum + day.spend, 0),
        totalClicks: aggregatedData.reduce((sum: number, day: any) => sum + day.clicks, 0),
        totalImpressions: aggregatedData.reduce((sum: number, day: any) => sum + day.impressions, 0),
        totalConversions: aggregatedData.reduce((sum: number, day: any) => sum + day.conversions, 0)
      }
    })

  } catch (error) {
    console.error('Meta Ads API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Meta Ads data' },
      { status: 500 }
    )
  }
}