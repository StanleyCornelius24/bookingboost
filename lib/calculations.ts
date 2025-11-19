/**
 * Booking Analytics Calculation Functions
 *
 * This module provides reusable calculation functions for analyzing
 * booking data, channel performance, ROI, and commission savings.
 */

// Types
export interface Booking {
  id: string
  channel: string
  revenue: number
  booking_date: string
  commission_rate?: number
  commission_paid?: number
  is_direct?: boolean
}

export interface ChannelStats {
  channel: string
  bookings: number
  revenue: number
  commissionPaid: number
  commissionRate: number
  isDirect: boolean
  percentage: number
  emoji?: string
}

export interface MonthlyTrend {
  month: string
  date: string
  revenue: number
  bookings: number
  directBookings: number
  otaBookings: number
  directRevenue: number
  otaRevenue: number
  directPercentage: number
  commissionsPaid: number
}

export type HealthStatus = 'excellent' | 'good' | 'warning' | 'urgent'

/**
 * Calculate performance statistics for each booking channel
 *
 * Aggregates bookings by channel and calculates totals, commissions,
 * and percentages for each channel.
 *
 * @param bookings - Array of booking records
 * @returns Array of channel statistics sorted by revenue (descending)
 *
 * @example
 * const stats = calculateChannelStats(bookings)
 * // Returns: [
 * //   { channel: 'Direct Website', bookings: 85, revenue: 156000, ... },
 * //   { channel: 'Booking.com', bookings: 42, revenue: 98000, ... }
 * // ]
 */
export function calculateChannelStats(bookings: Booking[]): ChannelStats[] {
  if (!bookings || bookings.length === 0) return []

  // Group bookings by channel
  const channelMap = new Map<string, {
    bookings: number
    revenue: number
    commissionPaid: number
    isDirect: boolean
  }>()

  let totalRevenue = 0

  bookings.forEach((booking) => {
    const channel = booking.channel || 'Unknown'
    const existing = channelMap.get(channel) || {
      bookings: 0,
      revenue: 0,
      commissionPaid: 0,
      isDirect: booking.is_direct || false
    }

    existing.bookings += 1
    existing.revenue += booking.revenue || 0
    existing.commissionPaid += booking.commission_paid || 0

    channelMap.set(channel, existing)
    totalRevenue += booking.revenue || 0
  })

  // Convert map to array of stats
  const stats: ChannelStats[] = Array.from(channelMap.entries()).map(([channel, data]) => {
    const commissionRate = data.revenue > 0
      ? (data.commissionPaid / data.revenue) * 100
      : 0

    return {
      channel,
      bookings: data.bookings,
      revenue: data.revenue,
      commissionPaid: data.commissionPaid,
      commissionRate,
      isDirect: data.isDirect,
      percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
      emoji: getChannelEmoji(channel)
    }
  })

  // Sort by revenue descending
  return stats.sort((a, b) => b.revenue - a.revenue)
}

/**
 * Calculate the percentage of bookings that are direct (non-OTA)
 *
 * @param bookings - Array of booking records
 * @returns Direct booking percentage (0-100)
 *
 * @example
 * const directPct = calculateDirectPercentage(bookings)
 * // Returns: 67.5 (meaning 67.5% of bookings are direct)
 */
export function calculateDirectPercentage(bookings: Booking[]): number {
  if (!bookings || bookings.length === 0) return 0

  const directBookings = bookings.filter(b => b.is_direct || isDirectChannel(b.channel))
  return (directBookings.length / bookings.length) * 100
}

/**
 * Calculate total OTA commissions paid across all bookings
 *
 * Sums up commission_paid for all OTA (non-direct) bookings.
 * If commission_paid is not available, estimates based on revenue
 * and standard commission rates.
 *
 * @param bookings - Array of booking records
 * @param estimateIfMissing - Whether to estimate commissions if not provided (default: true)
 * @returns Total commission amount paid to OTAs
 *
 * @example
 * const totalCommissions = calculateOTACommissions(bookings)
 * // Returns: 29500 (R29,500 paid in commissions)
 */
export function calculateOTACommissions(
  bookings: Booking[],
  estimateIfMissing: boolean = true
): number {
  if (!bookings || bookings.length === 0) return 0

  let totalCommissions = 0

  bookings.forEach((booking) => {
    const isDirect = booking.is_direct || isDirectChannel(booking.channel)

    if (!isDirect) {
      if (booking.commission_paid !== undefined && booking.commission_paid !== null) {
        totalCommissions += booking.commission_paid
      } else if (estimateIfMissing && booking.revenue) {
        // Estimate commission based on channel
        const rate = getStandardCommissionRate(booking.channel)
        totalCommissions += booking.revenue * rate
      }
    }
  })

  return totalCommissions
}

/**
 * Calculate blended ROI from marketing spend and direct revenue
 *
 * ROI = (Direct Revenue - Marketing Spend) / Marketing Spend
 *
 * @param marketingSpend - Total marketing investment
 * @param directRevenue - Revenue from direct bookings
 * @returns ROI as a multiplier (e.g., 3.2 means 3.2x return)
 *
 * @example
 * const roi = calculateBlendedROI(5000, 16000)
 * // Returns: 3.2 (meaning R3.20 earned for every R1 spent)
 */
export function calculateBlendedROI(
  marketingSpend: number,
  directRevenue: number
): number {
  if (marketingSpend === 0) return 0
  return directRevenue / marketingSpend
}

/**
 * Calculate potential commission savings from improving direct booking percentage
 *
 * Shows how much money could be saved by increasing the direct booking rate
 * from current to target percentage.
 *
 * @param bookings - Array of booking records
 * @param currentDirectPct - Current direct booking percentage
 * @param targetDirectPct - Target direct booking percentage
 * @returns Object with monthly and annual savings estimates
 *
 * @example
 * const savings = calculateCommissionSavings(bookings, 50, 70)
 * // Returns: { monthly: 8500, annual: 102000, improvement: 20 }
 */
export function calculateCommissionSavings(
  bookings: Booking[],
  currentDirectPct: number,
  targetDirectPct: number
): {
  monthly: number
  annual: number
  improvement: number
  averageCommissionRate: number
} {
  if (!bookings || bookings.length === 0) {
    return { monthly: 0, annual: 0, improvement: 0, averageCommissionRate: 0 }
  }

  const improvement = targetDirectPct - currentDirectPct

  if (improvement <= 0) {
    return { monthly: 0, annual: 0, improvement: 0, averageCommissionRate: 0 }
  }

  // Calculate average monthly revenue
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.revenue || 0), 0)

  // Calculate average commission rate from OTA bookings
  const otaBookings = bookings.filter(b => !b.is_direct && !isDirectChannel(b.channel))
  const totalOTACommissions = calculateOTACommissions(bookings)
  const totalOTARevenue = otaBookings.reduce((sum, b) => sum + (b.revenue || 0), 0)
  const avgCommissionRate = totalOTARevenue > 0
    ? totalOTACommissions / totalOTARevenue
    : 0.15 // Default to 15% if can't calculate

  // Calculate monthly savings potential
  const revenueShift = (improvement / 100) * totalRevenue
  const monthlySavings = revenueShift * avgCommissionRate

  return {
    monthly: monthlySavings,
    annual: monthlySavings * 12,
    improvement,
    averageCommissionRate: avgCommissionRate * 100
  }
}

/**
 * Aggregate bookings into monthly trends
 *
 * Groups bookings by month and calculates key metrics for each period.
 * Useful for trend charts and historical analysis.
 *
 * @param bookings - Array of booking records
 * @param monthsBack - Number of months to look back (default: 6)
 * @returns Array of monthly trend data
 *
 * @example
 * const trends = getMonthlyTrends(bookings, 6)
 * // Returns: [
 * //   { month: 'Jan', revenue: 125000, directPercentage: 45, ... },
 * //   { month: 'Feb', revenue: 142000, directPercentage: 52, ... }
 * // ]
 */
export function getMonthlyTrends(
  bookings: Booking[],
  monthsBack: number = 6
): MonthlyTrend[] {
  if (!bookings || bookings.length === 0) return []

  // Calculate date range
  const endDate = new Date()
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - monthsBack)

  // Filter bookings within date range
  const relevantBookings = bookings.filter(b => {
    const bookingDate = new Date(b.booking_date)
    return bookingDate >= startDate && bookingDate <= endDate
  })

  // Group by month
  const monthMap = new Map<string, Booking[]>()

  relevantBookings.forEach(booking => {
    const date = new Date(booking.booking_date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, [])
    }
    monthMap.get(monthKey)!.push(booking)
  })

  // Calculate stats for each month
  const trends: MonthlyTrend[] = []

  monthMap.forEach((monthBookings, monthKey) => {
    const [year, month] = monthKey.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, 1)
    const monthName = date.toLocaleDateString('en-US', { month: 'short' })

    const totalRevenue = monthBookings.reduce((sum, b) => sum + (b.revenue || 0), 0)
    const directBookings = monthBookings.filter(b => b.is_direct || isDirectChannel(b.channel))
    const otaBookings = monthBookings.filter(b => !b.is_direct && !isDirectChannel(b.channel))

    const directRevenue = directBookings.reduce((sum, b) => sum + (b.revenue || 0), 0)
    const otaRevenue = otaBookings.reduce((sum, b) => sum + (b.revenue || 0), 0)

    const directPercentage = monthBookings.length > 0
      ? (directBookings.length / monthBookings.length) * 100
      : 0

    const commissionsPaid = otaBookings.reduce((sum, b) => {
      if (b.commission_paid !== undefined) return sum + b.commission_paid
      // Estimate if not available
      const rate = getStandardCommissionRate(b.channel)
      return sum + (b.revenue || 0) * rate
    }, 0)

    trends.push({
      month: monthName,
      date: monthKey,
      revenue: totalRevenue,
      bookings: monthBookings.length,
      directBookings: directBookings.length,
      otaBookings: otaBookings.length,
      directRevenue,
      otaRevenue,
      directPercentage,
      commissionsPaid
    })
  })

  // Sort by date
  return trends.sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Determine health status based on direct booking percentage
 *
 * Provides a quick health indicator for dashboard displays.
 *
 * @param directPercentage - Direct booking percentage (0-100)
 * @returns Health status: 'excellent', 'good', 'warning', or 'urgent'
 *
 * @example
 * const status = determineHealthStatus(67)
 * // Returns: 'excellent'
 *
 * const status2 = determineHealthStatus(35)
 * // Returns: 'urgent'
 */
export function determineHealthStatus(directPercentage: number): HealthStatus {
  if (directPercentage >= 70) return 'excellent'
  if (directPercentage >= 60) return 'good'
  if (directPercentage >= 50) return 'warning'
  return 'urgent'
}

/**
 * Get health status with descriptive message
 *
 * @param directPercentage - Direct booking percentage
 * @returns Object with status and message
 */
export function getHealthStatusWithMessage(directPercentage: number): {
  status: HealthStatus
  message: string
  color: string
} {
  const status = determineHealthStatus(directPercentage)

  const statusMap = {
    excellent: {
      message: 'Excellent! You\'re maximizing revenue and minimizing commissions.',
      color: 'green'
    },
    good: {
      message: 'Good performance! You\'re above industry average.',
      color: 'blue'
    },
    warning: {
      message: 'Room for improvement. Focus on increasing direct bookings.',
      color: 'yellow'
    },
    urgent: {
      message: 'High OTA dependency. Prioritize direct booking strategies.',
      color: 'red'
    }
  }

  return {
    status,
    ...statusMap[status]
  }
}

// Helper functions

/**
 * Check if a channel is a direct booking channel
 */
function isDirectChannel(channel: string): boolean {
  const directChannels = [
    'direct',
    'website',
    'direct website',
    'phone',
    'email',
    'walk-in',
    'repeat guest'
  ]

  return directChannels.some(dc =>
    channel.toLowerCase().includes(dc)
  )
}

/**
 * Get standard commission rate for a channel
 * Used for estimation when actual commission is not available
 */
function getStandardCommissionRate(channel: string): number {
  const channelLower = channel.toLowerCase()

  if (isDirectChannel(channel)) return 0
  if (channelLower.includes('booking.com')) return 0.15
  if (channelLower.includes('airbnb')) return 0.15
  if (channelLower.includes('expedia')) return 0.20
  if (channelLower.includes('agoda')) return 0.15
  if (channelLower.includes('hotels.com')) return 0.18

  // Default OTA rate
  return 0.15
}

/**
 * Get emoji for a channel
 */
function getChannelEmoji(channel: string): string {
  const channelLower = channel.toLowerCase()

  if (isDirectChannel(channel)) return '🌐'
  if (channelLower.includes('booking.com')) return '🏨'
  if (channelLower.includes('airbnb')) return '🏠'
  if (channelLower.includes('expedia')) return '✈️'
  if (channelLower.includes('agoda')) return '🛏️'
  if (channelLower.includes('hotels.com')) return '🏢'

  return '📱'
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = 'ZAR'): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Calculate average booking value
 */
export function calculateAverageBookingValue(bookings: Booking[]): number {
  if (!bookings || bookings.length === 0) return 0

  const totalRevenue = bookings.reduce((sum, b) => sum + (b.revenue || 0), 0)
  return totalRevenue / bookings.length
}

/**
 * Calculate conversion rate from clicks to bookings
 */
export function calculateConversionRate(bookings: number, clicks: number): number {
  if (clicks === 0) return 0
  return (bookings / clicks) * 100
}

/**
 * Compare two time periods and calculate percentage change
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}
