import { createServerClient } from '@/lib/supabase/server'

export interface ClientMetrics {
  id: string
  name: string
  email: string
  currency: string
  totalRevenue: number
  totalBookings: number
  directBookings: number
  directPercentage: number
  otaCommission: number
  lastDataUpload: string | null
  status: 'excellent' | 'good' | 'needs-attention'
}

export interface AgencySummary {
  totalClients: number
  totalRevenue: number
  avgDirectPercentage: number
  totalOtaCommissions: number
}

export async function getAgencyClientMetrics(
  startDate?: string,
  endDate?: string
): Promise<{ clients: ClientMetrics[]; summary: AgencySummary }> {
  const supabase = await createServerClient()

  // Default to current month if no dates provided
  const now = new Date()
  const defaultStartDate = startDate || `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-01`
  const defaultEndDate = endDate || now.toISOString().split('T')[0]

  try {
    // Get all hotels (clients)
    const { data: hotels, error: hotelsError } = await supabase
      .from('hotels')
      .select('*')
      .order('name')

    if (hotelsError) throw hotelsError

    const clients: ClientMetrics[] = []
    let totalRevenue = 0
    let totalDirectPercentage = 0
    let totalOtaCommissions = 0

    for (const hotel of hotels || []) {
      // Get bookings for this hotel in date range
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('hotel_id', hotel.id)
        .gte('booking_date', defaultStartDate)
        .lte('booking_date', defaultEndDate)

      if (bookingsError) {
        console.error('Error fetching bookings for hotel:', hotel.id, bookingsError)
        continue
      }

      // Get last data upload date
      const { data: latestBooking } = await supabase
        .from('bookings')
        .select('created_at')
        .eq('hotel_id', hotel.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      // Calculate metrics
      const totalBookingsCount = bookings?.length || 0
      const hotelTotalRevenue = bookings?.reduce((sum, booking) => sum + booking.revenue, 0) || 0
      const hotelOtaCommission = bookings?.reduce((sum, booking) => sum + (booking.commission_amount || 0), 0) || 0

      // Calculate direct bookings (channels like "Direct", "Direct Booking", or commission_rate = 0)
      const directBookings = bookings?.filter(booking =>
        booking.channel.toLowerCase().includes('direct') ||
        booking.commission_rate === 0
      ).length || 0

      const directPercentage = totalBookingsCount > 0 ? (directBookings / totalBookingsCount) * 100 : 0

      // Determine status based on direct booking percentage
      let status: 'excellent' | 'good' | 'needs-attention'
      if (directPercentage >= 60) {
        status = 'excellent'
      } else if (directPercentage >= 50) {
        status = 'good'
      } else {
        status = 'needs-attention'
      }

      const clientMetrics: ClientMetrics = {
        id: hotel.id,
        name: hotel.name,
        email: hotel.email,
        currency: hotel.currency || 'ZAR',
        totalRevenue: hotelTotalRevenue,
        totalBookings: totalBookingsCount,
        directBookings,
        directPercentage,
        otaCommission: hotelOtaCommission,
        lastDataUpload: latestBooking?.created_at || null,
        status
      }

      clients.push(clientMetrics)

      // Add to totals
      totalRevenue += hotelTotalRevenue
      totalDirectPercentage += directPercentage
      totalOtaCommissions += hotelOtaCommission
    }

    const avgDirectPercentage = clients.length > 0 ? totalDirectPercentage / clients.length : 0

    const summary: AgencySummary = {
      totalClients: clients.length,
      totalRevenue,
      avgDirectPercentage,
      totalOtaCommissions
    }

    return { clients, summary }

  } catch (error) {
    console.error('Error fetching agency client metrics:', error)
    return {
      clients: [],
      summary: {
        totalClients: 0,
        totalRevenue: 0,
        avgDirectPercentage: 0,
        totalOtaCommissions: 0
      }
    }
  }
}