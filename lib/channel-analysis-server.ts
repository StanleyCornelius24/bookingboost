import { createServerClient } from '@/lib/supabase/server'
import { COMMISSION_RATES } from '@/lib/constants'
import { ChannelAnalysisData, ChannelAnalysis, ChannelChartData } from './channel-analysis-types'

export async function getChannelAnalysis(
  hotelId: string,
  startDate?: string,
  endDate?: string
): Promise<ChannelAnalysisData | null> {
  const supabase = await createServerClient()

  // Default to current month if no dates provided
  const now = new Date()
  const defaultStartDate = startDate || `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-01`
  const defaultEndDate = endDate || now.toISOString().split('T')[0]

  try {
    // Get hotel to verify it exists
    const { data: hotel, error: hotelError } = await supabase
      .from('hotels')
      .select('id, currency')
      .eq('id', hotelId)
      .single()

    if (hotelError || !hotel) {
      console.error('Hotel not found:', hotelError)
      return null
    }

    // Get all bookings for the date range
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('hotel_id', hotelId)
      .gte('booking_date', defaultStartDate)
      .lte('booking_date', defaultEndDate)

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError)
      return null
    }

    if (!bookings || bookings.length === 0) {
      return {
        channels: [],
        summary: {
          totalBookings: 0,
          totalRevenue: 0,
          totalCommissions: 0,
          totalNetRevenue: 0,
          avgCommissionRate: 0
        },
        chartData: []
      }
    }

    // Get custom commission rates for this hotel
    const { data: customRates } = await supabase
      .from('commission_rates')
      .select('channel_name, commission_rate')
      .eq('hotel_id', hotelId)
      .eq('is_active', true)

    // Build commission rates map with custom rates overriding defaults
    const commissionRates = { ...COMMISSION_RATES }
    customRates?.forEach(rate => {
      commissionRates[rate.channel_name] = rate.commission_rate
    })

    // Group bookings by channel
    const channelGroups = new Map<string, {
      bookings: typeof bookings
      totalRevenue: number
      commissionPaid: number
    }>()

    let totalRevenue = 0
    let totalCommissions = 0

    bookings.forEach(booking => {
      const channel = booking.channel
      totalRevenue += booking.revenue

      if (!channelGroups.has(channel)) {
        channelGroups.set(channel, {
          bookings: [],
          totalRevenue: 0,
          commissionPaid: 0
        })
      }

      const group = channelGroups.get(channel)!
      group.bookings.push(booking)
      group.totalRevenue += booking.revenue

      // Calculate commission using stored amount or rate
      const commission = booking.commission_amount ||
        (booking.revenue * (booking.commission_rate || commissionRates[channel] || 0))

      group.commissionPaid += commission
      totalCommissions += commission
    })

    // Convert to analysis objects
    const channels: ChannelAnalysis[] = Array.from(channelGroups.entries()).map(([channel, data]) => {
      const bookingsCount = data.bookings.length
      const avgBookingValue = bookingsCount > 0 ? data.totalRevenue / bookingsCount : 0
      const commissionRate = commissionRates[channel] || 0
      const netRevenue = data.totalRevenue - data.commissionPaid
      const percentageOfTotal = totalRevenue > 0 ? (data.totalRevenue / totalRevenue) * 100 : 0

      return {
        channel,
        bookingsCount,
        totalRevenue: data.totalRevenue,
        percentageOfTotal,
        commissionRate,
        commissionPaid: data.commissionPaid,
        netRevenue,
        avgBookingValue
      }
    })

    // Sort by total revenue (highest first)
    channels.sort((a, b) => b.totalRevenue - a.totalRevenue)

    // Calculate summary
    const totalBookings = bookings.length
    const totalNetRevenue = totalRevenue - totalCommissions
    const avgCommissionRate = totalRevenue > 0 ? (totalCommissions / totalRevenue) * 100 : 0

    const summary = {
      totalBookings,
      totalRevenue,
      totalCommissions,
      totalNetRevenue,
      avgCommissionRate
    }

    // Prepare chart data
    const chartData: ChannelChartData[] = channels.map(channel => ({
      channel: channel.channel.length > 15 ?
        channel.channel.substring(0, 12) + '...' :
        channel.channel,
      grossRevenue: channel.totalRevenue,
      commission: channel.commissionPaid,
      netRevenue: channel.netRevenue
    }))

    return {
      channels,
      summary,
      chartData
    }

  } catch (error) {
    console.error('Error in getChannelAnalysis:', error)
    return null
  }
}
