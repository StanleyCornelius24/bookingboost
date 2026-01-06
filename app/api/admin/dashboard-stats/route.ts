import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7)

    // Check if user is admin
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userHotel } = await supabase
      .from('hotels')
      .select('user_role')
      .eq('user_id', session.user.id)
      .single()

    if (!userHotel || userHotel.user_role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse month for date range
    const startDate = `${month}-01`
    const date = new Date(startDate)
    date.setMonth(date.getMonth() + 1)
    const endDate = date.toISOString().slice(0, 10)

    // Get all hotels
    const { data: hotels, error: hotelsError } = await supabase
      .from('hotels')
      .select('*')
      .order('created_at', { ascending: false })

    if (hotelsError) throw hotelsError

    // Get booking counts and revenue per hotel for the selected month
    const hotelsWithStats = await Promise.all(
      (hotels || []).map(async (hotel) => {
        // Count bookings
        const { count: bookingCount } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('hotel_id', hotel.id)
          .gte('booking_date', startDate)
          .lt('booking_date', endDate)

        // Get all bookings with channel info
        const { data: bookingData } = await supabase
          .from('bookings')
          .select('revenue, channel, commission_rate')
          .eq('hotel_id', hotel.id)
          .gte('booking_date', startDate)
          .lt('booking_date', endDate)

        const totalRevenue = bookingData?.reduce(
          (sum, booking) => sum + Number(booking.revenue || 0),
          0
        ) || 0

        // Calculate direct bookings
        const directBookingsData = bookingData?.filter(booking =>
          booking.channel?.toLowerCase().includes('direct') ||
          booking.commission_rate === 0
        ) || []

        const directBookingCount = directBookingsData.length
        const directRevenue = directBookingsData.reduce(
          (sum, booking) => sum + Number(booking.revenue || 0),
          0
        )

        return {
          ...hotel,
          bookingCount: bookingCount || 0,
          totalRevenue,
          directBookingCount,
          directRevenue
        }
      })
    )

    // Calculate total stats
    const { count: totalBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .gte('booking_date', startDate)
      .lt('booking_date', endDate)

    const { data: revenueData } = await supabase
      .from('bookings')
      .select('revenue')
      .gte('booking_date', startDate)
      .lt('booking_date', endDate)

    const totalRevenue = revenueData?.reduce(
      (sum, booking) => sum + Number(booking.revenue || 0),
      0
    ) || 0

    // Get unique users
    const uniqueUsers = new Set(hotels?.map(h => h.user_id))

    const stats = {
      totalHotels: hotels?.length || 0,
      totalUsers: uniqueUsers.size,
      totalRevenue,
      totalBookings: totalBookings || 0
    }

    return NextResponse.json({ stats, hotels: hotelsWithStats })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
