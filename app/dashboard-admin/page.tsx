import { createServerClient } from '@/lib/supabase/server'
import AdminDashboard from '@/components/admin/AdminDashboard'

export default async function AdminDashboardPage() {
  const supabase = await createServerClient()

  // Get current month
  const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format
  const startDate = `${currentMonth}-01`
  const date = new Date(startDate)
  date.setMonth(date.getMonth() + 1)
  const endDate = date.toISOString().slice(0, 10)

  // Fetch all hotels
  const { data: hotels } = await supabase
    .from('hotels')
    .select('*')
    .order('created_at', { ascending: false })

  // Get booking counts and revenue per hotel for current month
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

  // Calculate total stats for current month
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

  const initialStats = {
    totalHotels: hotels?.length || 0,
    totalUsers: uniqueUsers.size,
    totalRevenue,
    totalBookings: totalBookings || 0
  }

  return (
    <AdminDashboard
      initialHotels={hotelsWithStats}
      initialStats={initialStats}
      currentMonth={currentMonth}
    />
  )
}
