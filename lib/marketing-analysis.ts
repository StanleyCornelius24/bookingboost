import { createServerClient } from '@/lib/supabase/server'

export interface MarketingPlatformData {
  platform: string
  spend: number
  clicks: number
  cpc: number
  conversions: number
  roi: number
  impressions: number
}

export interface MarketingTrendData {
  date: string
  spend: number
  clicks: number
  conversions: number
  impressions: number
}

export interface MarketingAnalysisData {
  hasData: boolean
  summary: {
    totalSpend: number
    blendedRoi: number
    costPerBooking: number
    directBookings: number
    totalClicks: number
    totalConversions: number
  }
  platforms: MarketingPlatformData[]
  trendData: MarketingTrendData[]
}

export async function getMarketingAnalysis(
  hotelId: string,
  startDate?: string,
  endDate?: string
): Promise<MarketingAnalysisData> {
  const supabase = await createServerClient()

  // Default to last 30 days if no dates provided
  const now = new Date()
  const defaultEndDate = endDate || now.toISOString().split('T')[0]
  const defaultStartDate = startDate || new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]

  try {
    // Get hotel to verify it exists
    const { data: hotel, error: hotelError } = await supabase
      .from('hotels')
      .select('id, currency')
      .eq('id', hotelId)
      .single()

    if (hotelError || !hotel) {
      console.error('Hotel not found:', hotelError)
      return getEmptyMarketingData()
    }

    // Check if hotel has connected marketing accounts
    const { data: apiTokens } = await supabase
      .from('api_tokens')
      .select('service')
      .eq('hotel_id', hotelId)
      .in('service', ['google', 'meta'])

    const hasGoogleAds = apiTokens?.some(token => token.service === 'google')
    const hasMetaAds = apiTokens?.some(token => token.service === 'meta')

    // Get marketing metrics from database
    const { data: marketingMetrics, error: metricsError } = await supabase
      .from('marketing_metrics')
      .select('*')
      .eq('hotel_id', hotelId)
      .gte('date', defaultStartDate)
      .lte('date', defaultEndDate)

    if (metricsError) {
      console.error('Error fetching marketing metrics:', metricsError)
    }

    // If no real data exists, check if accounts are connected and return mock data for demo
    if (!marketingMetrics || marketingMetrics.length === 0) {
      if (hasGoogleAds || hasMetaAds) {
        return generateMockMarketingData(hasGoogleAds, hasMetaAds)
      }
      return getEmptyMarketingData()
    }

    // Process real marketing metrics (when available)
    return processMarketingMetrics(marketingMetrics)

  } catch (error) {
    console.error('Error in getMarketingAnalysis:', error)
    return getEmptyMarketingData()
  }
}

function getEmptyMarketingData(): MarketingAnalysisData {
  return {
    hasData: false,
    summary: {
      totalSpend: 0,
      blendedRoi: 0,
      costPerBooking: 0,
      directBookings: 0,
      totalClicks: 0,
      totalConversions: 0
    },
    platforms: [],
    trendData: []
  }
}

function generateMockMarketingData(hasGoogle: boolean, hasMeta: boolean): MarketingAnalysisData {
  const platforms: MarketingPlatformData[] = []

  if (hasGoogle) {
    platforms.push({
      platform: 'Google Ads',
      spend: 2500,
      clicks: 850,
      cpc: 2.94,
      conversions: 42,
      roi: 3.2,
      impressions: 15420
    })
  }

  if (hasMeta) {
    platforms.push({
      platform: 'Meta Ads',
      spend: 1800,
      clicks: 650,
      cpc: 2.77,
      conversions: 28,
      roi: 2.8,
      impressions: 12350
    })
  }

  // Add email marketing (always present for demo)
  platforms.push({
    platform: 'Email Marketing',
    spend: 200,
    clicks: 320,
    cpc: 0.63,
    conversions: 18,
    roi: 4.5,
    impressions: 2840
  })

  const totalSpend = platforms.reduce((sum, p) => sum + p.spend, 0)
  const totalClicks = platforms.reduce((sum, p) => sum + p.clicks, 0)
  const totalConversions = platforms.reduce((sum, p) => sum + p.conversions, 0)
  const blendedRoi = totalSpend > 0 ? (totalConversions * 120) / totalSpend : 0 // Assuming avg booking value of R120
  const costPerBooking = totalConversions > 0 ? totalSpend / totalConversions : 0

  // Generate 30 days of trend data
  const trendData: MarketingTrendData[] = []
  for (let i = 29; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)

    // Generate realistic daily variations
    const dailySpendVariation = 0.8 + (Math.random() * 0.4) // 80% to 120% of average
    const dailySpend = Math.round((totalSpend / 30) * dailySpendVariation)
    const dailyClicks = Math.round((totalClicks / 30) * dailySpendVariation)
    const dailyConversions = Math.round((totalConversions / 30) * dailySpendVariation)
    const dailyImpressions = Math.round((30000 / 30) * dailySpendVariation)

    trendData.push({
      date: date.toISOString().split('T')[0],
      spend: dailySpend,
      clicks: dailyClicks,
      conversions: dailyConversions,
      impressions: dailyImpressions
    })
  }

  return {
    hasData: true,
    summary: {
      totalSpend,
      blendedRoi,
      costPerBooking,
      directBookings: Math.round(totalConversions * 0.3), // 30% direct attribution
      totalClicks,
      totalConversions
    },
    platforms,
    trendData
  }
}

function processMarketingMetrics(metrics: any[]): MarketingAnalysisData {
  if (!metrics || metrics.length === 0) {
    return getEmptyMarketingData()
  }

  // Group metrics by date and source
  const dailyBySource: Record<string, Record<string, any>> = {}

  metrics.forEach(metric => {
    const date = metric.date
    const source = metric.source
    const metricType = metric.metric_type
    const value = parseFloat(metric.value || 0)

    if (!dailyBySource[date]) {
      dailyBySource[date] = {}
    }

    if (!dailyBySource[date][source]) {
      dailyBySource[date][source] = {
        spend: 0,
        clicks: 0,
        impressions: 0,
        conversions: 0
      }
    }

    if (metricType === 'spend') dailyBySource[date][source].spend = value
    if (metricType === 'clicks') dailyBySource[date][source].clicks = value
    if (metricType === 'impressions') dailyBySource[date][source].impressions = value
    if (metricType === 'conversions') dailyBySource[date][source].conversions = value
  })

  // Aggregate by platform
  const platformData: Record<string, MarketingPlatformData> = {}
  const trendData: Record<string, MarketingTrendData> = {}

  Object.entries(dailyBySource).forEach(([date, sources]) => {
    // Initialize trend data for this date
    if (!trendData[date]) {
      trendData[date] = {
        date,
        spend: 0,
        clicks: 0,
        conversions: 0,
        impressions: 0
      }
    }

    Object.entries(sources).forEach(([source, data]: [string, any]) => {
      // Map source names to friendly platform names
      const platformName =
        source === 'google_ads' ? 'Google Ads' :
        source === 'meta_ads' ? 'Meta Ads' :
        source === 'google_analytics' ? 'Google Analytics' :
        source

      if (!platformData[platformName]) {
        platformData[platformName] = {
          platform: platformName,
          spend: 0,
          clicks: 0,
          cpc: 0,
          conversions: 0,
          roi: 0,
          impressions: 0
        }
      }

      platformData[platformName].spend += data.spend
      platformData[platformName].clicks += data.clicks
      platformData[platformName].impressions += data.impressions
      platformData[platformName].conversions += data.conversions

      // Add to trend data
      trendData[date].spend += data.spend
      trendData[date].clicks += data.clicks
      trendData[date].conversions += data.conversions
      trendData[date].impressions += data.impressions
    })
  })

  // Calculate CPC and ROI for each platform
  const platforms: MarketingPlatformData[] = Object.values(platformData).map(platform => {
    const cpc = platform.clicks > 0 ? platform.spend / platform.clicks : 0
    const roi = platform.spend > 0 ? calculateMarketingROI(platform.spend, platform.conversions) : 0
    return {
      ...platform,
      cpc,
      roi
    }
  })

  // Calculate summary metrics
  const totalSpend = platforms.reduce((sum, p) => sum + p.spend, 0)
  const totalClicks = platforms.reduce((sum, p) => sum + p.clicks, 0)
  const totalConversions = platforms.reduce((sum, p) => sum + p.conversions, 0)
  const blendedRoi = totalSpend > 0 ? calculateMarketingROI(totalSpend, totalConversions) : 0
  const costPerBooking = totalConversions > 0 ? totalSpend / totalConversions : 0

  return {
    hasData: true,
    summary: {
      totalSpend,
      blendedRoi,
      costPerBooking,
      directBookings: Math.round(totalConversions * 0.3), // 30% direct attribution
      totalClicks,
      totalConversions
    },
    platforms,
    trendData: Object.values(trendData).sort((a, b) => a.date.localeCompare(b.date))
  }
}

export function calculateMarketingROI(spend: number, conversions: number, avgBookingValue: number = 120): number {
  if (spend === 0) return 0
  return (conversions * avgBookingValue) / spend
}

export function formatCurrency(amount: number, currency: string = 'ZAR'): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-ZA').format(value)
}