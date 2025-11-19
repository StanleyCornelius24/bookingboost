import { createServerClient } from '@/lib/supabase/server'

export interface ClientDashboardData {
  hero: {
    thisMonthRevenue: number
    lastMonthRevenue: number
    percentageChange: number
    bestMonthThisYear: boolean
    currency: string
  }
  stats: {
    directBookingsPercentage: number
    directBookingsGoal: number
    moneySaved: number
    totalBookings: number
    marketingRoi: number
  }
  revenueHistory: RevenueHistoryPoint[]
  insight: {
    type: 'success' | 'warning' | 'info'
    title: string
    description: string
    amount?: number
  }
}

export interface RevenueHistoryPoint {
  month: string
  revenue: number
}

export async function getClientDashboardData(hotelId: string): Promise<ClientDashboardData | null> {
  const supabase = await createServerClient()

  try {
    // Get hotel info
    const { data: hotel, error: hotelError } = await supabase
      .from('hotels')
      .select('currency')
      .eq('id', hotelId)
      .single()

    if (hotelError || !hotel) {
      console.error('Hotel not found:', hotelError)
      return null
    }

    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

    // Get current month bookings
    const { data: currentBookings, error: currentError } = await supabase
      .from('bookings')
      .select('*')
      .eq('hotel_id', hotelId)
      .gte('booking_date', currentMonthStart.toISOString().split('T')[0])
      .lte('booking_date', currentMonthEnd.toISOString().split('T')[0])

    if (currentError) {
      console.error('Error fetching current bookings:', currentError)
      return null
    }

    // Get last month bookings
    const { data: lastMonthBookings, error: lastMonthError } = await supabase
      .from('bookings')
      .select('*')
      .eq('hotel_id', hotelId)
      .gte('booking_date', lastMonthStart.toISOString().split('T')[0])
      .lte('booking_date', lastMonthEnd.toISOString().split('T')[0])

    if (lastMonthError) {
      console.error('Error fetching last month bookings:', lastMonthError)
    }

    // Calculate metrics
    const thisMonthRevenue = currentBookings?.reduce((sum, booking) => sum + booking.revenue, 0) || 0
    const lastMonthRevenue = lastMonthBookings?.reduce((sum, booking) => sum + booking.revenue, 0) || 0
    const percentageChange = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0

    const totalBookings = currentBookings?.length || 0
    const directBookings = currentBookings?.filter(booking =>
      booking.channel.toLowerCase().includes('direct') ||
      booking.commission_rate === 0
    ).length || 0

    const directBookingsPercentage = totalBookings > 0 ? (directBookings / totalBookings) * 100 : 0
    const directBookingsGoal = 70 // Target 70% direct bookings

    // Calculate money saved (what OTA commissions would have been if all were OTA)
    const avgOtaCommissionRate = 0.15 // 15% average OTA commission
    const potentialOtaCommissions = thisMonthRevenue * avgOtaCommissionRate
    const actualCommissions = currentBookings?.reduce((sum, booking) => sum + (booking.commission_amount || 0), 0) || 0
    const moneySaved = potentialOtaCommissions - actualCommissions

    // Generate 18 months of revenue history with actual data
    const revenueHistory: RevenueHistoryPoint[] = []

    // Fetch all bookings for the last 18 months using batch fetching
    const eighteenMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 17, 1)

    // Get count first
    const { count: historyCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('hotel_id', hotelId)
      .gte('booking_date', eighteenMonthsAgo.toISOString().split('T')[0])

    // Fetch in batches
    const historyPageSize = 1000
    const historyTotalPages = Math.ceil((historyCount || 0) / historyPageSize)
    let allHistoricalBookings: any[] = []

    for (let historyPage = 0; historyPage < historyTotalPages; historyPage++) {
      const historyFrom = historyPage * historyPageSize
      const historyTo = historyFrom + historyPageSize - 1

      const { data } = await supabase
        .from('bookings')
        .select('booking_date, revenue')
        .eq('hotel_id', hotelId)
        .gte('booking_date', eighteenMonthsAgo.toISOString().split('T')[0])
        .range(historyFrom, historyTo)

      if (data) {
        allHistoricalBookings = [...allHistoricalBookings, ...data]
      }
    }

    // Group bookings by month
    const monthlyRevenue = new Map<string, number>()

    if (allHistoricalBookings.length > 0) {
      allHistoricalBookings.forEach(booking => {
        const bookingDate = new Date(booking.booking_date)
        const monthKey = `${bookingDate.getFullYear()}-${String(bookingDate.getMonth() + 1).padStart(2, '0')}`
        const currentRevenue = monthlyRevenue.get(monthKey) || 0
        monthlyRevenue.set(monthKey, currentRevenue + booking.revenue)
      })
    }

    // Build the revenue history array
    for (let i = 17; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      revenueHistory.push({
        month: monthName,
        revenue: monthlyRevenue.get(monthKey) || 0
      })
    }

    // Check if this is the best month this year
    const bestMonthThisYear = revenueHistory.every(point => point.revenue <= thisMonthRevenue)

    // Calculate marketing ROI (placeholder for now)
    const marketingRoi = 2.4 // Sample ROI

    // Generate insight
    const insight = generateInsight(
      directBookingsPercentage,
      moneySaved,
      percentageChange,
      hotel.currency
    )

    return {
      hero: {
        thisMonthRevenue,
        lastMonthRevenue,
        percentageChange,
        bestMonthThisYear,
        currency: hotel.currency || 'ZAR'
      },
      stats: {
        directBookingsPercentage,
        directBookingsGoal,
        moneySaved,
        totalBookings,
        marketingRoi
      },
      revenueHistory,
      insight
    }

  } catch (error) {
    console.error('Error in getClientDashboardData:', error)
    return null
  }
}

function generateInsight(
  directPercentage: number,
  moneySaved: number,
  revenueChange: number,
  currency: string
): ClientDashboardData['insight'] {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Priority: Direct bookings improvement
  if (directPercentage > 50) {
    return {
      type: 'success',
      title: 'Great direct booking performance!',
      description: `Your direct bookings are at ${directPercentage.toFixed(1)}%, saving you ${formatCurrency(moneySaved)} in commissions this month.`,
      amount: moneySaved
    }
  }

  // Revenue growth
  if (revenueChange > 10) {
    return {
      type: 'success',
      title: 'Strong revenue growth',
      description: `Revenue is up ${revenueChange.toFixed(1)}% from last month. Keep up the momentum!`,
    }
  }

  // Default insight
  return {
    type: 'info',
    title: 'Keep building momentum',
    description: `Focus on driving more direct bookings to reduce commission costs and increase profitability.`,
  }
}