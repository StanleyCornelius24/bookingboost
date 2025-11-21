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
