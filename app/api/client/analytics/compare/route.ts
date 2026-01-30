import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { startOfMonth, endOfMonth, format, eachMonthOfInterval } from 'date-fns'

// Helper function to fetch all bookings in batches (handles 1000 row limit)
async function fetchAllBookingsInPeriod(
  supabase: any,
  hotelId: string,
  startDate: string,
  endDate: string
) {
  // First get the count for this period
  const { count } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('hotel_id', hotelId)
    .gte('booking_date', startDate)
    .lte('booking_date', endDate)

  if (!count || count === 0) {
    return []
  }

  console.log(`Period ${startDate} to ${endDate}: ${count} bookings found`)

  // Fetch in batches of 1000
  const pageSize = 1000
  const totalPages = Math.ceil(count / pageSize)
  let allBookings: any[] = []

  for (let page = 0; page < totalPages; page++) {
    const from = page * pageSize
    const to = from + pageSize - 1

    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('hotel_id', hotelId)
      .gte('booking_date', startDate)
      .lte('booking_date', endDate)
      .order('booking_date', { ascending: false })
      .range(from, to)

    if (error) {
      console.error(`Error fetching batch ${page + 1}:`, error)
      throw error
    }

    if (data) {
      allBookings = [...allBookings, ...data]
      console.log(`Fetched batch ${page + 1}/${totalPages}: ${data.length} bookings`)
    }
  }

  console.log(`Total fetched for period: ${allBookings.length}`)
  return allBookings
}

export async function POST(request: Request) {
  const supabase = await createServerClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get hotel (get primary or first hotel)
  const { data: hotels } = await supabase
    .from('hotels')
    .select('id, currency')
    .eq('user_id', user.id)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true })

  if (!hotels || hotels.length === 0) {
    return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })
  }

  const hotel = hotels[0]

  try {
    const body = await request.json()
    const { periodA, periodB } = body

    console.log('=== PERIOD A DEBUG ===')
    console.log('Period A range:', periodA.start, 'to', periodA.end)

    // Fetch bookings for Period A (with batching)
    const periodABookings = await fetchAllBookingsInPeriod(
      supabase,
      hotel.id,
      periodA.start,
      periodA.end
    )

    console.log('Period A bookings count:', periodABookings?.length || 0)
    if (periodABookings && periodABookings.length > 0) {
      console.log('Sample booking dates:', periodABookings.slice(0, 5).map(b => b.booking_date))
      const novemberBookings = periodABookings.filter(b => b.booking_date && b.booking_date.startsWith('2025-11'))
      console.log('November 2025 bookings count:', novemberBookings.length)
      if (novemberBookings.length > 0) {
        console.log('November booking samples:', novemberBookings.slice(0, 3).map(b => ({
          date: b.booking_date,
          channel: b.channel,
          revenue: b.revenue
        })))
      }
    }

    console.log('=== PERIOD B DEBUG ===')
    console.log('Period B range:', periodB.start, 'to', periodB.end)

    // Fetch bookings for Period B (with batching)
    const periodBBookings = await fetchAllBookingsInPeriod(
      supabase,
      hotel.id,
      periodB.start,
      periodB.end
    )

    console.log('Period B bookings count:', periodBBookings?.length || 0)

    // Calculate metrics for Period A
    const periodAData = calculatePeriodMetrics(periodABookings || [], periodA.start, periodA.end)

    // Calculate metrics for Period B
    const periodBData = calculatePeriodMetrics(periodBBookings || [], periodB.start, periodB.end)

    return NextResponse.json({
      periodA: periodAData,
      periodB: periodBData,
      currency: hotel.currency || 'ZAR'
    })
  } catch (error: any) {
    console.error('Analytics comparison error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch comparison data' },
      { status: 500 }
    )
  }
}

function calculatePeriodMetrics(bookings: any[], startDate: string, endDate: string) {
  // Calculate totals
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.revenue || 0), 0)
  const totalBookings = bookings.length

  // Separate direct and OTA bookings
  const directBookings = bookings.filter(b =>
    b.channel?.toLowerCase().includes('direct') || b.commission_rate === 0
  )
  const otaBookings = bookings.filter(b =>
    !b.channel?.toLowerCase().includes('direct') && b.commission_rate > 0
  )

  const directRevenue = directBookings.reduce((sum, b) => sum + (b.revenue || 0), 0)
  const otaRevenue = otaBookings.reduce((sum, b) => sum + (b.revenue || 0), 0)

  const totalCommissions = bookings.reduce((sum, b) => sum + (b.commission_amount || 0), 0)

  const directPercentage = totalBookings > 0 ? (directBookings.length / totalBookings) * 100 : 0

  // Generate monthly breakdown
  const monthlyData = generateMonthlyBreakdown(bookings, startDate, endDate)

  return {
    totalRevenue,
    directRevenue,
    otaRevenue,
    totalBookings,
    directBookings: directBookings.length,
    otaBookings: otaBookings.length,
    totalCommissions,
    directPercentage,
    monthlyData
  }
}

function generateMonthlyBreakdown(bookings: any[], startDate: string, endDate: string) {
  const start = new Date(startDate)
  const end = new Date(endDate)

  // Get all months in the period
  const months = eachMonthOfInterval({ start, end })

  console.log('=== MONTHLY BREAKDOWN DEBUG ===')
  console.log('Date range:', startDate, 'to', endDate)
  console.log('Months generated:', months.map(m => format(m, 'MMM yyyy')))
  console.log('Total bookings to process:', bookings.length)

  return months.map(monthDate => {
    const monthStart = startOfMonth(monthDate)
    const monthEnd = endOfMonth(monthDate)
    const monthName = format(monthDate, 'MMM yyyy')

    // Filter bookings for this month
    const monthBookings = bookings.filter(b => {
      const bookingDate = new Date(b.booking_date)
      return bookingDate >= monthStart && bookingDate <= monthEnd
    })

    if (monthName === 'Nov 2025') {
      console.log('=== NOVEMBER 2025 SPECIFIC DEBUG ===')
      console.log('Month start:', monthStart.toISOString())
      console.log('Month end:', monthEnd.toISOString())
      console.log('November bookings found:', monthBookings.length)
      if (monthBookings.length > 0) {
        console.log('November booking details:', monthBookings.map(b => ({
          booking_date: b.booking_date,
          channel: b.channel,
          revenue: b.revenue
        })))
      } else {
        // Check if any bookings are close to November
        const allBookingDates = bookings.map(b => b.booking_date).sort()
        console.log('All booking dates (sorted):', allBookingDates)
      }
    }

    // Separate direct and OTA
    const directBookings = monthBookings.filter(b =>
      b.channel?.toLowerCase().includes('direct') || b.commission_rate === 0
    )
    const otaBookings = monthBookings.filter(b =>
      !b.channel?.toLowerCase().includes('direct') && b.commission_rate > 0
    )

    const directRevenue = directBookings.reduce((sum, b) => sum + (b.revenue || 0), 0)
    const otaRevenue = otaBookings.reduce((sum, b) => sum + (b.revenue || 0), 0)

    const directPercentage = monthBookings.length > 0
      ? (directBookings.length / monthBookings.length) * 100
      : 0

    return {
      month: format(monthDate, 'MMM yyyy'),
      directRevenue,
      otaRevenue,
      directBookings: directBookings.length,
      otaBookings: otaBookings.length,
      directPercentage
    }
  })
}
