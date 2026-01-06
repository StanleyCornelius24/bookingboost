import { createServerClient } from '@/lib/supabase/server'

export interface ClientChannelData {
  channel: string
  emoji: string
  bookings: number
  revenue: number
  commissionPaid: number
  isDirect: boolean
  averageLeadTime: number // days between booking_date and checkin_date
  averageLengthOfStay: number // number of nights
  adr: number // Average Daily Rate: revenue / total nights
}

export interface ClientChannelsAnalysis {
  channels: ClientChannelData[]
  summary: {
    totalOtaCommissions: number
    directPercentage: number
    industryAverage: { min: number; max: number }
    performanceRating: 'excellent' | 'above-average' | 'average' | 'below-average'
    performanceBadge: string
  }
  chartData: Array<{
    name: string
    value: number
    color: string
    isDirect: boolean
  }>
  explanation: {
    directRatio: string
    otaRatio: string
    simpleExplanation: string
  }
  currency: string
}

export async function getClientChannelsAnalysis(
  hotelId: string,
  startDate: string | null = null,
  endDate: string | null = null
): Promise<ClientChannelsAnalysis | null> {
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

    // Calculate industry average from all bookings across all hotels
    const { count: industryBookingsCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })

    // Fetch all industry bookings in batches
    const industryPageSize = 1000
    const industryTotalPages = Math.ceil((industryBookingsCount || 0) / industryPageSize)
    let allIndustryBookings: any[] = []

    for (let industryPage = 0; industryPage < industryTotalPages; industryPage++) {
      const industryFrom = industryPage * industryPageSize
      const industryTo = industryFrom + industryPageSize - 1

      const { data: industryData } = await supabase
        .from('bookings')
        .select('channel')
        .range(industryFrom, industryTo)

      if (industryData) {
        allIndustryBookings = [...allIndustryBookings, ...industryData]
      }
    }

    // Calculate industry direct booking percentage
    const industryDirectBookings = allIndustryBookings.filter(booking =>
      booking.channel && booking.channel.toLowerCase().includes('direct')
    ).length
    const industryDirectPercentage = allIndustryBookings.length > 0
      ? (industryDirectBookings / allIndustryBookings.length) * 100
      : 55 // fallback to 55% if no data

    // Use industry average as a range (±5% from the actual average)
    const industryAverage = {
      min: Math.max(0, Math.round(industryDirectPercentage - 5)),
      max: Math.min(100, Math.round(industryDirectPercentage + 5))
    }

    // Use provided dates or default to current month
    let dateStart: string
    let dateEnd: string

    if (startDate && endDate) {
      dateStart = startDate
      dateEnd = endDate
    } else {
      const now = new Date()
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      dateStart = currentMonthStart.toISOString().split('T')[0]
      dateEnd = currentMonthEnd.toISOString().split('T')[0]
    }

    // Get count first
    const { count } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('hotel_id', hotelId)
      .gte('booking_date', dateStart)
      .lte('booking_date', dateEnd)

    // Fetch in batches if needed
    const pageSize = 1000
    const totalPages = Math.ceil((count || 0) / pageSize)
    let allBookings: any[] = []

    for (let page = 0; page < totalPages; page++) {
      const from = page * pageSize
      const to = from + pageSize - 1

      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('hotel_id', hotelId)
        .gte('booking_date', dateStart)
        .lte('booking_date', dateEnd)
        .order('booking_date', { ascending: false })
        .range(from, to)

      if (error) {
        console.error('Error fetching bookings:', error)
        return null
      }

      if (data) {
        allBookings = [...allBookings, ...data]
      }
    }

    const bookings = allBookings

    // Get all unique channels from all bookings (all time)
    // First get total count
    const { count: channelCount } = await supabase
      .from('bookings')
      .select('channel', { count: 'exact', head: true })
      .eq('hotel_id', hotelId)

    // Fetch all channels in batches
    const channelPageSize = 1000
    const channelTotalPages = Math.ceil((channelCount || 0) / channelPageSize)
    let allTimeBookings: any[] = []

    for (let channelPage = 0; channelPage < channelTotalPages; channelPage++) {
      const channelFrom = channelPage * channelPageSize
      const channelTo = channelFrom + channelPageSize - 1

      const { data } = await supabase
        .from('bookings')
        .select('channel')
        .eq('hotel_id', hotelId)
        .range(channelFrom, channelTo)

      if (data) {
        allTimeBookings = [...allTimeBookings, ...data]
      }
    }

    const allChannels = new Set<string>()
    allTimeBookings.forEach(booking => {
      if (booking.channel) {
        allChannels.add(booking.channel)
      }
    })

    if (allChannels.size === 0) {
      return getEmptyChannelsData(hotel.currency || 'ZAR')
    }

    // Fetch commission rates for this hotel
    const { data: commissionRates } = await supabase
      .from('commission_rates')
      .select('channel_name, commission_rate, is_active')
      .eq('hotel_id', hotelId)

    // Create a map of channel names to commission rates
    const commissionRateMap = new Map<string, number>()
    if (commissionRates) {
      commissionRates.forEach(rate => {
        if (rate.is_active) {
          commissionRateMap.set(rate.channel_name, rate.commission_rate)
        }
      })
    }

    // Initialize all channels with zero values
    const channelGroups = new Map<string, {
      bookings: number
      revenue: number
      commissionPaid: number
      totalLeadTimeDays: number
      totalNights: number
    }>()

    allChannels.forEach(channel => {
      channelGroups.set(channel, {
        bookings: 0,
        revenue: 0,
        commissionPaid: 0,
        totalLeadTimeDays: 0,
        totalNights: 0
      })
    })

    let totalRevenue = 0
    let totalCommissions = 0

    // Fill in data for the selected date range
    bookings.forEach(booking => {
      const channel = booking.channel
      totalRevenue += booking.revenue

      const group = channelGroups.get(channel)!
      group.bookings += 1
      group.revenue += booking.revenue

      // Calculate commission based on current commission rate
      const commissionRate = commissionRateMap.get(channel) || 0
      const commissionAmount = booking.revenue * commissionRate
      group.commissionPaid += commissionAmount
      totalCommissions += commissionAmount

      // Calculate lead time (days between booking_date and checkin_date)
      if (booking.booking_date && booking.checkin_date) {
        const bookingDate = new Date(booking.booking_date)
        const checkinDate = new Date(booking.checkin_date)
        const leadTimeDays = Math.round((checkinDate.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24))
        group.totalLeadTimeDays += leadTimeDays
      }

      // Track total nights
      if (booking.nights) {
        group.totalNights += booking.nights
      }
    })

    // Convert to channel data with emojis
    const channels: ClientChannelData[] = Array.from(channelGroups.entries()).map(([channel, data]) => {
      const isDirect = channel.toLowerCase().includes('direct')

      // Calculate averages
      const averageLeadTime = data.bookings > 0 ? data.totalLeadTimeDays / data.bookings : 0
      const averageLengthOfStay = data.bookings > 0 ? data.totalNights / data.bookings : 0
      const adr = data.totalNights > 0 ? data.revenue / data.totalNights : 0

      return {
        channel,
        emoji: getChannelEmoji(channel),
        bookings: data.bookings,
        revenue: data.revenue,
        commissionPaid: data.commissionPaid,
        isDirect,
        averageLeadTime,
        averageLengthOfStay,
        adr
      }
    })

    // Sort by revenue (highest first)
    channels.sort((a, b) => b.revenue - a.revenue)

    // Calculate metrics
    const totalBookings = bookings.length
    const directBookings = channels.filter(ch => ch.isDirect).reduce((sum, ch) => sum + ch.bookings, 0)
    const directPercentage = totalBookings > 0 ? (directBookings / totalBookings) * 100 : 0

    // Determine performance rating
    const { rating, badge } = getPerformanceRating(directPercentage)

    // Prepare chart data (only channels with revenue in selected period)
    const chartData = channels
      .filter(channel => channel.revenue > 0)
      .map((channel, index) => ({
        name: channel.channel,
        value: channel.revenue,
        color: channel.isDirect ? '#10B981' : getOtaColor(index), // Green for direct, blues for OTA
        isDirect: channel.isDirect
      }))

    // Generate explanation
    const explanation = generateExplanation(directPercentage)

    return {
      channels,
      summary: {
        totalOtaCommissions: totalCommissions,
        directPercentage,
        industryAverage,
        performanceRating: rating,
        performanceBadge: badge
      },
      chartData,
      explanation,
      currency: hotel.currency || 'ZAR'
    }

  } catch (error) {
    console.error('Error in getClientChannelsAnalysis:', error)
    return null
  }
}

function getChannelEmoji(channel: string): string {
  const channelLower = channel.toLowerCase()

  if (channelLower.includes('direct')) return '✅'
  if (channelLower.includes('booking.com')) return '📘'
  if (channelLower.includes('expedia')) return '🔷'
  if (channelLower.includes('airbnb')) return '🏠'
  if (channelLower.includes('agoda')) return '🔵'
  if (channelLower.includes('hotels.com')) return '🏨'
  if (channelLower.includes('hotelbeds')) return '🛏️'
  if (channelLower.includes('sabre')) return '✈️'
  if (channelLower.includes('amadeus')) return '🌍'

  return '📋' // Default emoji for other channels
}

function getOtaColor(index: number): string {
  const otaColors = [
    '#3B82F6', // Blue
    '#1D4ED8', // Darker blue
    '#2563EB', // Medium blue
    '#1E40AF', // Blue variant
    '#1E3A8A', // Navy blue
    '#60A5FA', // Light blue
    '#93C5FD', // Lighter blue
    '#DBEAFE'  // Very light blue
  ]
  return otaColors[index % otaColors.length]
}

function getPerformanceRating(directPercentage: number): {
  rating: 'excellent' | 'above-average' | 'average' | 'below-average'
  badge: string
} {
  if (directPercentage >= 70) {
    return { rating: 'excellent', badge: 'Excellent ⭐⭐⭐' }
  } else if (directPercentage >= 60) {
    return { rating: 'above-average', badge: 'Above Average ⭐⭐' }
  } else if (directPercentage >= 50) {
    return { rating: 'above-average', badge: 'Above Average ⭐' }
  } else if (directPercentage >= 30) {
    return { rating: 'average', badge: 'Industry Average' }
  } else {
    return { rating: 'below-average', badge: 'Room for Improvement' }
  }
}

function generateExplanation(directPercentage: number): {
  directRatio: string
  otaRatio: string
  simpleExplanation: string
} {
  const directOutOfTen = Math.round(directPercentage / 10)
  const otaOutOfTen = 10 - directOutOfTen

  return {
    directRatio: directOutOfTen.toString(),
    otaRatio: otaOutOfTen.toString(),
    simpleExplanation: `For every 10 bookings, ${directOutOfTen} come through your website (no commission) and ${otaOutOfTen} come through OTAs.`
  }
}

function getEmptyChannelsData(currency: string): ClientChannelsAnalysis {
  return {
    channels: [],
    summary: {
      totalOtaCommissions: 0,
      directPercentage: 0,
      industryAverage: { min: 50, max: 60 },
      performanceRating: 'below-average',
      performanceBadge: 'No Data'
    },
    chartData: [],
    explanation: {
      directRatio: '0',
      otaRatio: '10',
      simpleExplanation: 'Upload booking data to see your channel breakdown.'
    },
    currency
  }
}