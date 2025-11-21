import { createServerClient } from '@/lib/supabase/server'
import type { Hotel } from '@/types'

export interface HotelDetailMetrics {
  hotel: Hotel
  totalRevenue: number
  totalBookings: number
  directBookings: number
  directPercentage: number
  otaCommission: number
  marketingRoi: number
  channelBreakdown: ChannelData[]
  revenueHistory: RevenueHistoryData[]
  monthlyComparison: MonthlyComparisonData
}

export interface ChannelData {
  name: string
  value: number
  percentage: number
  color: string
  [key: string]: string | number
}

export interface RevenueHistoryData {
  month: string
  totalRevenue: number
  directRevenue: number
  otaRevenue: number
}

export interface MonthlyComparisonData {
  thisMonth: {
    bookings: number
    revenue: number
    directPercentage: number
    commissions: number
  }
  lastMonth: {
    bookings: number
    revenue: number
    directPercentage: number
    commissions: number
  }
  changes: {
    bookingsChange: number
    revenueChange: number
    directPercentageChange: number
    commissionsChange: number
  }
}

export async function getHotelDetailMetrics(hotelId: string): Promise<HotelDetailMetrics | null> {
  const supabase = await createServerClient()

  try {
    // Get hotel info
    const { data: hotel, error: hotelError } = await supabase
      .from('hotels')
      .select('*')
      .eq('id', hotelId)
      .single()

    if (hotelError || !hotel) {
      console.error('Hotel not found:', hotelError)
      return null
    }

    // Get current month date range
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

    // Get all bookings for current month
    const { data: currentBookings, error: currentBookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('hotel_id', hotelId)
      .gte('booking_date', currentMonthStart.toISOString().split('T')[0])
      .lte('booking_date', currentMonthEnd.toISOString().split('T')[0])

    if (currentBookingsError) {
      console.error('Error fetching current bookings:', currentBookingsError)
      return null
    }

    // Get last month bookings for comparison
    const { data: lastMonthBookings, error: lastMonthBookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('hotel_id', hotelId)
      .gte('booking_date', lastMonthStart.toISOString().split('T')[0])
      .lte('booking_date', lastMonthEnd.toISOString().split('T')[0])

    if (lastMonthBookingsError) {
      console.error('Error fetching last month bookings:', lastMonthBookingsError)
    }

    // Calculate current month metrics
    const totalRevenue = currentBookings?.reduce((sum, booking) => sum + booking.revenue, 0) || 0
    const totalBookings = currentBookings?.length || 0
    const otaCommission = currentBookings?.reduce((sum, booking) => sum + (booking.commission_amount || 0), 0) || 0

    const directBookings = currentBookings?.filter(booking =>
      booking.channel.toLowerCase().includes('direct') ||
      booking.commission_rate === 0
    ).length || 0

    const directPercentage = totalBookings > 0 ? (directBookings / totalBookings) * 100 : 0

    // Calculate last month metrics for comparison
    const lastMonthTotalRevenue = lastMonthBookings?.reduce((sum, booking) => sum + booking.revenue, 0) || 0
    const lastMonthTotalBookings = lastMonthBookings?.length || 0
    const lastMonthOtaCommission = lastMonthBookings?.reduce((sum, booking) => sum + (booking.commission_amount || 0), 0) || 0
    const lastMonthDirectBookings = lastMonthBookings?.filter(booking =>
      booking.channel.toLowerCase().includes('direct') ||
      booking.commission_rate === 0
    ).length || 0
    const lastMonthDirectPercentage = lastMonthTotalBookings > 0 ? (lastMonthDirectBookings / lastMonthTotalBookings) * 100 : 0

    // Calculate channel breakdown
    const channelGroups = new Map<string, { revenue: number; count: number }>()

    currentBookings?.forEach(booking => {
      const existingChannel = channelGroups.get(booking.channel)
      if (existingChannel) {
        existingChannel.revenue += booking.revenue
        existingChannel.count += 1
      } else {
        channelGroups.set(booking.channel, { revenue: booking.revenue, count: 1 })
      }
    })

    const channelColors = [
      '#3B82F6', // blue
      '#10B981', // green
      '#F59E0B', // yellow
      '#EF4444', // red
      '#8B5CF6', // purple
      '#F97316', // orange
      '#06B6D4', // cyan
      '#84CC16', // lime
    ]

    const channelBreakdown: ChannelData[] = Array.from(channelGroups.entries())
      .map(([channel, data], index) => ({
        name: channel,
        value: data.revenue,
        percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
        color: channelColors[index % channelColors.length]
      }))
      .sort((a, b) => b.value - a.value)

    // Generate sample revenue history for last 6 months
    const revenueHistory: RevenueHistoryData[] = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

      // For now, use sample data with realistic patterns
      const baseRevenue = totalRevenue * (0.8 + Math.random() * 0.4) // ±20% variation
      const directRatio = directPercentage / 100
      const directRevenue = baseRevenue * directRatio
      const otaRevenue = baseRevenue - directRevenue

      revenueHistory.push({
        month: monthName,
        totalRevenue: Math.round(baseRevenue),
        directRevenue: Math.round(directRevenue),
        otaRevenue: Math.round(otaRevenue)
      })
    }

    // Calculate changes
    const monthlyComparison: MonthlyComparisonData = {
      thisMonth: {
        bookings: totalBookings,
        revenue: totalRevenue,
        directPercentage: directPercentage,
        commissions: otaCommission
      },
      lastMonth: {
        bookings: lastMonthTotalBookings,
        revenue: lastMonthTotalRevenue,
        directPercentage: lastMonthDirectPercentage,
        commissions: lastMonthOtaCommission
      },
      changes: {
        bookingsChange: lastMonthTotalBookings > 0 ? ((totalBookings - lastMonthTotalBookings) / lastMonthTotalBookings) * 100 : 0,
        revenueChange: lastMonthTotalRevenue > 0 ? ((totalRevenue - lastMonthTotalRevenue) / lastMonthTotalRevenue) * 100 : 0,
        directPercentageChange: directPercentage - lastMonthDirectPercentage,
        commissionsChange: lastMonthOtaCommission > 0 ? ((otaCommission - lastMonthOtaCommission) / lastMonthOtaCommission) * 100 : 0
      }
    }

    // Calculate marketing ROI (placeholder for now)
    const marketingRoi = 0 // Will be calculated when marketing_metrics are connected

    return {
      hotel,
      totalRevenue,
      totalBookings,
      directBookings,
      directPercentage,
      otaCommission,
      marketingRoi,
      channelBreakdown,
      revenueHistory,
      monthlyComparison
    }

  } catch (error) {
    console.error('Error fetching hotel detail metrics:', error)
    return null
  }
}