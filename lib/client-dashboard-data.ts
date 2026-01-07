import { createServerClient } from '@/lib/supabase/server'

export interface ClientDashboardData {
  latestBookingDate: string | null
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
  monthlyBreakdown: MonthlyBreakdown[]
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
  directRevenue: number
  otaRevenue: number
}

export interface MonthlyBreakdown {
  month: string
  monthKey: string
  directBookings: number
  directRevenue: number
  otaBookings: number
  otaRevenue: number
  totalBookings: number
  totalRevenue: number
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
    // Change default to last month vs previous month
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 2, 1)
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0)

    // Helper function to format dates without timezone issues
    const formatDate = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    // Get last month bookings (primary period)
    const { data: currentBookings, error: currentError } = await supabase
      .from('bookings')
      .select('*')
      .eq('hotel_id', hotelId)
      .gte('booking_date', formatDate(lastMonthStart))
      .lte('booking_date', formatDate(lastMonthEnd))

    if (currentError) {
      console.error('Error fetching current bookings:', currentError)
      return null
    }

    // Get previous month bookings (comparison period)
    const { data: lastMonthBookings, error: lastMonthError } = await supabase
      .from('bookings')
      .select('*')
      .eq('hotel_id', hotelId)
      .gte('booking_date', formatDate(previousMonthStart))
      .lte('booking_date', formatDate(previousMonthEnd))

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
    const directBookingsGoal = 30 // Target 30% direct bookings

    // Calculate money saved (what OTA commissions would have been if all were OTA)
    const avgOtaCommissionRate = 0.15 // 15% average OTA commission
    const potentialOtaCommissions = thisMonthRevenue * avgOtaCommissionRate
    const actualCommissions = currentBookings?.reduce((sum, booking) => sum + (booking.commission_amount || 0), 0) || 0
    const moneySaved = potentialOtaCommissions - actualCommissions

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
        .select('booking_date, revenue, channel, commission_rate')
        .eq('hotel_id', hotelId)
        .gte('booking_date', eighteenMonthsAgo.toISOString().split('T')[0])
        .range(historyFrom, historyTo)

      if (data) {
        allHistoricalBookings = [...allHistoricalBookings, ...data]
      }
    }

    // Generate monthly breakdown for last 18 months (for both chart and table)
    const monthlyBreakdown: MonthlyBreakdown[] = []

    for (let i = 17; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`

      // Filter bookings for this month
      const monthBookings = allHistoricalBookings.filter(booking => {
        const bookingDate = new Date(booking.booking_date)
        return bookingDate >= monthStart && bookingDate <= monthEnd
      })

      // Separate direct and OTA bookings
      const directBookingsMonth = monthBookings.filter(booking =>
        booking.channel?.toLowerCase().includes('direct') ||
        booking.commission_rate === 0
      )

      const otaBookingsMonth = monthBookings.filter(booking =>
        !booking.channel?.toLowerCase().includes('direct') &&
        booking.commission_rate !== 0
      )

      monthlyBreakdown.push({
        month: monthName,
        monthKey,
        directBookings: directBookingsMonth.length,
        directRevenue: directBookingsMonth.reduce((sum, b) => sum + (b.revenue || 0), 0),
        otaBookings: otaBookingsMonth.length,
        otaRevenue: otaBookingsMonth.reduce((sum, b) => sum + (b.revenue || 0), 0),
        totalBookings: monthBookings.length,
        totalRevenue: monthBookings.reduce((sum, b) => sum + (b.revenue || 0), 0)
      })
    }

    // Build revenue history from monthly breakdown (use same data for chart and table)
    const revenueHistory: RevenueHistoryPoint[] = monthlyBreakdown.map(month => ({
      month: month.month,
      revenue: month.totalRevenue,
      directRevenue: month.directRevenue,
      otaRevenue: month.otaRevenue
    }))

    // Check if this is the best month this year
    const bestMonthThisYear = revenueHistory.every(point => point.revenue <= thisMonthRevenue)

    // Calculate marketing ROI (placeholder for now)
    const marketingRoi = 2.4 // Sample ROI

    // Get the latest booking date
    const { data: latestBooking } = await supabase
      .from('bookings')
      .select('booking_date')
      .eq('hotel_id', hotelId)
      .order('booking_date', { ascending: false })
      .limit(1)
      .single()

    const latestBookingDate = latestBooking?.booking_date || null

    // Generate insight
    const insight = generateInsight(
      directBookingsPercentage,
      moneySaved,
      percentageChange,
      hotel.currency
    )

    return {
      latestBookingDate,
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
      monthlyBreakdown: monthlyBreakdown.slice(-12), // Only last 12 months for table
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