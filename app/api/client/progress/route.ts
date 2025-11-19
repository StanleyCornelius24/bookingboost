import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { startOfMonth, subMonths, endOfMonth, format } from 'date-fns'

export async function GET() {
  const supabase = await createServerClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get hotel
  const { data: hotel } = await supabase
    .from('hotels')
    .select('id, currency')
    .eq('user_id', user.id)
    .single()

  if (!hotel) {
    return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })
  }

  try {
    // Calculate date ranges
    const now = new Date()
    const thisMonthStart = startOfMonth(now)
    const lastMonthStart = startOfMonth(subMonths(now, 1))
    const lastMonthEnd = endOfMonth(subMonths(now, 1))
    const threeMonthsAgoStart = startOfMonth(subMonths(now, 3))
    const threeMonthsAgoEnd = endOfMonth(subMonths(now, 3))

    // Fetch bookings for the last 6 months for historical data
    const sixMonthsAgoStart = startOfMonth(subMonths(now, 5))

    const { data: allBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('hotel_id', hotel.id)
      .gte('booking_date', sixMonthsAgoStart.toISOString().split('T')[0])

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError)
      return NextResponse.json({ error: bookingsError.message }, { status: 500 })
    }

    // If no bookings, return empty data structure
    if (!allBookings || allBookings.length === 0) {
      return NextResponse.json({
        hasData: false,
        threeMonthsAgo: null,
        lastMonth: null,
        thisMonth: null,
        historicalData: [],
        currency: hotel.currency || 'ZAR',
      })
    }

    // Helper function to calculate metrics for a period
    const calculatePeriodMetrics = (startDate: Date, endDate: Date) => {
      const periodBookings = allBookings.filter((b) => {
        const bookingDate = new Date(b.booking_date)
        return bookingDate >= startDate && bookingDate <= endDate
      })

      const totalRevenue = periodBookings.reduce((sum, b) => sum + (b.revenue || 0), 0)
      const directBookings = periodBookings.filter((b) =>
        b.channel === 'Direct Booking' || b.channel?.toLowerCase().includes('direct')
      )
      const directRevenue = directBookings.reduce((sum, b) => sum + (b.revenue || 0), 0)
      const directPercentage = totalRevenue > 0 ? (directRevenue / totalRevenue) * 100 : 0

      const otaCommissions = periodBookings
        .filter((b) => b.channel !== 'Direct Booking' && !b.channel?.toLowerCase().includes('direct'))
        .reduce((sum, b) => sum + (b.commission_amount || 0), 0)

      return {
        revenue: totalRevenue,
        directPercentage: Math.round(directPercentage),
        otaCommissions: otaCommissions,
        bookings: periodBookings.length,
      }
    }

    // Calculate metrics for each period
    const threeMonthsAgo = calculatePeriodMetrics(threeMonthsAgoStart, threeMonthsAgoEnd)
    const lastMonth = calculatePeriodMetrics(lastMonthStart, lastMonthEnd)
    const thisMonth = calculatePeriodMetrics(thisMonthStart, now)

    // Calculate historical data for the last 6 months
    const historicalData = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i))
      const monthEnd = i === 0 ? now : endOfMonth(subMonths(now, i))
      const monthMetrics = calculatePeriodMetrics(monthStart, monthEnd)

      historicalData.push({
        month: format(monthStart, 'MMM'),
        directPercentage: monthMetrics.directPercentage,
      })
    }

    return NextResponse.json({
      hasData: true,
      threeMonthsAgo,
      lastMonth,
      thisMonth,
      historicalData,
      currency: hotel.currency || 'ZAR',
    })
  } catch (error: any) {
    console.error('Progress calculation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to calculate progress' },
      { status: 500 }
    )
  }
}
