/**
 * Usage Examples for Calculation Functions
 *
 * This file demonstrates how to use the calculation functions
 * in your dashboard pages and API routes.
 */

import {
  calculateChannelStats,
  calculateDirectPercentage,
  calculateOTACommissions,
  calculateBlendedROI,
  calculateCommissionSavings,
  getMonthlyTrends,
  determineHealthStatus,
  getHealthStatusWithMessage,
  type Booking,
  type ChannelStats,
  type MonthlyTrend
} from './calculations'

// ============================================================================
// Example 1: Client Dashboard Overview
// ============================================================================

export async function getClientDashboardData(hotelId: string) {
  // Fetch bookings from database
  const bookings: Booking[] = await fetchBookings(hotelId)

  // Calculate key metrics
  const directPercentage = calculateDirectPercentage(bookings)
  const otaCommissions = calculateOTACommissions(bookings)
  const channelStats = calculateChannelStats(bookings)
  const monthlyTrends = getMonthlyTrends(bookings, 6)
  const healthStatus = getHealthStatusWithMessage(directPercentage)

  // Calculate revenue
  const totalRevenue = bookings.reduce((sum, b) => sum + b.revenue, 0)
  const directBookings = bookings.filter(b => b.is_direct)
  const directRevenue = directBookings.reduce((sum, b) => sum + b.revenue, 0)

  return {
    stats: {
      totalRevenue,
      directPercentage,
      otaCommissions,
      totalBookings: bookings.length,
      directBookings: directBookings.length
    },
    channels: channelStats,
    trends: monthlyTrends,
    health: healthStatus
  }
}

// ============================================================================
// Example 2: Progress Page - Calculate Savings
// ============================================================================

export async function getProgressPageData(hotelId: string) {
  const bookings = await fetchBookings(hotelId)

  // Get bookings from different time periods
  const now = new Date()
  const threeMonthsAgo = new Date(now.setMonth(now.getMonth() - 3))
  const lastMonth = new Date(now.setMonth(now.getMonth() - 1))

  const bookingsThreeMonthsAgo = bookings.filter(b =>
    new Date(b.booking_date) >= threeMonthsAgo &&
    new Date(b.booking_date) < lastMonth
  )

  const bookingsLastMonth = bookings.filter(b =>
    new Date(b.booking_date) >= lastMonth &&
    new Date(b.booking_date) < now
  )

  const bookingsThisMonth = bookings.filter(b =>
    new Date(b.booking_date) >= now
  )

  // Calculate direct percentage for each period
  const directPct3MonthsAgo = calculateDirectPercentage(bookingsThreeMonthsAgo)
  const directPctLastMonth = calculateDirectPercentage(bookingsLastMonth)
  const directPctThisMonth = calculateDirectPercentage(bookingsThisMonth)

  // Calculate potential savings
  const savings = calculateCommissionSavings(
    bookings,
    directPctThisMonth,
    70 // Target: 70%
  )

  return {
    comparison: {
      threeMonthsAgo: {
        directPercentage: directPct3MonthsAgo,
        revenue: bookingsThreeMonthsAgo.reduce((s, b) => s + b.revenue, 0),
        bookings: bookingsThreeMonthsAgo.length
      },
      lastMonth: {
        directPercentage: directPctLastMonth,
        revenue: bookingsLastMonth.reduce((s, b) => s + b.revenue, 0),
        bookings: bookingsLastMonth.length
      },
      thisMonth: {
        directPercentage: directPctThisMonth,
        revenue: bookingsThisMonth.reduce((s, b) => s + b.revenue, 0),
        bookings: bookingsThisMonth.length
      }
    },
    savings,
    trends: getMonthlyTrends(bookings, 6)
  }
}

// ============================================================================
// Example 3: Marketing Page - ROI Calculation
// ============================================================================

export async function getMarketingPageData(hotelId: string) {
  const bookings = await fetchBookings(hotelId)
  const marketingMetrics = await fetchMarketingMetrics(hotelId)

  // Calculate direct revenue
  const directBookings = bookings.filter(b => b.is_direct)
  const directRevenue = directBookings.reduce((sum, b) => sum + b.revenue, 0)

  // Calculate ROI for each marketing platform
  const platforms = marketingMetrics.map(metric => {
    const roi = calculateBlendedROI(metric.spend, metric.attributedRevenue)

    return {
      platform: metric.platform,
      spend: metric.spend,
      clicks: metric.clicks,
      conversions: metric.conversions,
      roi,
      cpc: metric.clicks > 0 ? metric.spend / metric.clicks : 0
    }
  })

  // Calculate blended ROI across all platforms
  const totalSpend = marketingMetrics.reduce((sum, m) => sum + m.spend, 0)
  const blendedRoi = calculateBlendedROI(totalSpend, directRevenue)

  return {
    platforms,
    summary: {
      totalSpend,
      directRevenue,
      blendedRoi,
      directBookings: directBookings.length
    }
  }
}

// ============================================================================
// Example 4: Channels Page - Full Analysis
// ============================================================================

export async function getChannelsPageData(hotelId: string) {
  const bookings = await fetchBookings(hotelId)

  // Get channel statistics
  const channels = calculateChannelStats(bookings)

  // Calculate summary metrics
  const directPercentage = calculateDirectPercentage(bookings)
  const totalOTACommissions = calculateOTACommissions(bookings)
  const healthStatus = determineHealthStatus(directPercentage)

  // Get performance comparison
  const industryAverage = { min: 50, max: 60 }
  let performanceBadge = 'Average'
  let performanceRating: 'excellent' | 'good' | 'below-average' = 'good'

  if (directPercentage >= 70) {
    performanceBadge = 'Excellent'
    performanceRating = 'excellent'
  } else if (directPercentage < 50) {
    performanceBadge = 'Below Average'
    performanceRating = 'below-average'
  }

  return {
    channels,
    summary: {
      directPercentage,
      totalOTACommissions,
      industryAverage,
      performanceBadge,
      performanceRating
    },
    health: healthStatus,
    // Simple explanation for clients
    explanation: {
      simpleExplanation: `Out of every 10 bookings, ${Math.round(directPercentage / 10)} come directly to you (no commission) and ${10 - Math.round(directPercentage / 10)} come through OTAs (with commission).`,
      directRatio: Math.round(directPercentage / 10),
      otaRatio: 10 - Math.round(directPercentage / 10)
    }
  }
}

// ============================================================================
// Example 5: Agency Dashboard - Detailed Analytics
// ============================================================================

export async function getAgencyDashboardData(hotelId: string) {
  const bookings = await fetchBookings(hotelId)

  // Calculate comprehensive stats
  const channelStats = calculateChannelStats(bookings)
  const directPercentage = calculateDirectPercentage(bookings)
  const otaCommissions = calculateOTACommissions(bookings)
  const monthlyTrends = getMonthlyTrends(bookings, 12) // 12 months for agency

  // Calculate period comparisons
  const thisMonth = bookings.filter(b => isThisMonth(b.booking_date))
  const lastMonth = bookings.filter(b => isLastMonth(b.booking_date))

  const thisMonthRevenue = thisMonth.reduce((sum, b) => sum + b.revenue, 0)
  const lastMonthRevenue = lastMonth.reduce((sum, b) => sum + b.revenue, 0)

  const monthOverMonthGrowth = lastMonthRevenue > 0
    ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
    : 0

  // Calculate average booking value
  const avgBookingValue = bookings.length > 0
    ? bookings.reduce((sum, b) => sum + b.revenue, 0) / bookings.length
    : 0

  return {
    overview: {
      totalRevenue: bookings.reduce((sum, b) => sum + b.revenue, 0),
      totalBookings: bookings.length,
      directPercentage,
      otaCommissions,
      avgBookingValue,
      monthOverMonthGrowth
    },
    channels: channelStats,
    trends: monthlyTrends,
    performance: {
      thisMonth: {
        revenue: thisMonthRevenue,
        bookings: thisMonth.length
      },
      lastMonth: {
        revenue: lastMonthRevenue,
        bookings: lastMonth.length
      }
    }
  }
}

// ============================================================================
// Example 6: Commission Savings Calculator Widget
// ============================================================================

export function CommissionSavingsCalculator({ bookings }: { bookings: Booking[] }) {
  const currentDirectPct = calculateDirectPercentage(bookings)

  // Calculate savings for different target scenarios
  const scenarios = [
    { target: 60, label: 'Industry Average' },
    { target: 70, label: 'Recommended Target' },
    { target: 80, label: 'Ambitious Goal' }
  ]

  const savingsScenarios = scenarios.map(scenario => {
    const savings = calculateCommissionSavings(
      bookings,
      currentDirectPct,
      scenario.target
    )

    return {
      ...scenario,
      ...savings
    }
  })

  return savingsScenarios
}

// ============================================================================
// Example 7: Health Status Dashboard Widget
// ============================================================================

export function getHealthDashboard(bookings: Booking[]) {
  const directPercentage = calculateDirectPercentage(bookings)
  const health = getHealthStatusWithMessage(directPercentage)

  // Get recommendations based on health status
  const recommendations: string[] = []

  if (health.status === 'urgent' || health.status === 'warning') {
    recommendations.push('Offer direct booking incentives (e.g., "Book direct and save 10%")')
    recommendations.push('Improve website booking experience')
    recommendations.push('Invest in Google Ads for your hotel name')
    recommendations.push('Build email list for remarketing')
  }

  if (health.status === 'good') {
    recommendations.push('Maintain current marketing efforts')
    recommendations.push('Consider small incentives to reach 70%')
  }

  if (health.status === 'excellent') {
    recommendations.push('Maintain your excellent performance')
    recommendations.push('Focus on guest retention and reviews')
  }

  return {
    directPercentage,
    health,
    recommendations
  }
}

// ============================================================================
// Helper Functions (Mock for examples)
// ============================================================================

async function fetchBookings(hotelId: string): Promise<Booking[]> {
  // This would be your actual database query
  // const { data } = await supabase.from('bookings').select('*').eq('hotel_id', hotelId)
  return []
}

async function fetchMarketingMetrics(hotelId: string): Promise<Array<{ platform: string; spend: number; clicks: number; conversions: number; attributedRevenue: number }>> {
  // This would fetch from your marketing_metrics table
  return []
}

function isThisMonth(dateStr: string): boolean {
  const date = new Date(dateStr)
  const now = new Date()
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
}

function isLastMonth(dateStr: string): boolean {
  const date = new Date(dateStr)
  const now = new Date()
  const lastMonth = new Date(now.setMonth(now.getMonth() - 1))
  return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear()
}
