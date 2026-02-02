import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const adminSupabase = createAdminClient()

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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') // Format: YYYY-MM
    const dateMode = searchParams.get('dateMode') || 'booked' // 'booked' or 'stayed'

    console.log('📊 Reports API called:', { month, dateMode })

    if (!month) {
      console.error('❌ No month parameter provided')
      return NextResponse.json({ error: 'Month parameter is required' }, { status: 400 })
    }

    // Parse the selected month
    const [year, monthNum] = month.split('-').map(Number)

    // Build dates as simple strings to avoid timezone issues
    const currentMonth = {
      start: `${year}-${String(monthNum).padStart(2, '0')}-01`,
      end: (() => {
        // Get last day of month
        const lastDay = new Date(year, monthNum, 0).getDate()
        return `${year}-${String(monthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
      })()
    }

    // Calculate previous month
    const prevMonthNum = monthNum === 1 ? 12 : monthNum - 1
    const prevYear = monthNum === 1 ? year - 1 : year
    const previousMonth = {
      start: `${prevYear}-${String(prevMonthNum).padStart(2, '0')}-01`,
      end: (() => {
        const lastDay = new Date(prevYear, prevMonthNum, 0).getDate()
        return `${prevYear}-${String(prevMonthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
      })()
    }

    // Fetch all hotels
    const { data: allHotels } = await adminSupabase
      .from('hotels')
      .select('id, name, currency, google_analytics_property_id, google_ads_customer_id, meta_ad_account_id')

    if (!allHotels || allHotels.length === 0) {
      return NextResponse.json({
        hotels: [],
        period: { currentMonth, previousMonth }
      })
    }

    // Get hotel IDs
    const hotelIds = allHotels.map(h => h.id)

    // Determine date field based on mode
    const dateField = dateMode === 'booked' ? 'booking_date' : 'checkin_date'

    // Fetch bookings for current month
    const { data: currentBookings, error: currentBookingsError } = await adminSupabase
      .from('bookings')
      .select('hotel_id, revenue, channel')
      .in('hotel_id', hotelIds)
      .gte(dateField, currentMonth.start)
      .lte(dateField, currentMonth.end)
      .eq('status', 'Booked')

    if (currentBookingsError) {
      console.error('Error fetching current bookings:', currentBookingsError)
    }

    // Fetch bookings for previous month
    const { data: previousBookings, error: previousBookingsError } = await adminSupabase
      .from('bookings')
      .select('hotel_id, revenue, channel')
      .in('hotel_id', hotelIds)
      .gte(dateField, previousMonth.start)
      .lte(dateField, previousMonth.end)
      .eq('status', 'Booked')

    if (previousBookingsError) {
      console.error('Error fetching previous bookings:', previousBookingsError)
    }

    // Fetch Google Analytics sessions from marketing_metrics (complete data source)
    const { data: currentGA, error: currentGAError } = await adminSupabase
      .from('marketing_metrics')
      .select('hotel_id, value')
      .in('hotel_id', hotelIds)
      .eq('source', 'google_analytics')
      .eq('metric_type', 'sessions')
      .gte('date', currentMonth.start)
      .lte('date', currentMonth.end)

    console.log('📊 Current GA data:', currentGA ? `${currentGA.length} records` : 'null/undefined')
    if (currentGAError) {
      console.error('❌ Error fetching current GA - code:', currentGAError.code)
      console.error('❌ Error fetching current GA - message:', currentGAError.message)
      console.error('❌ Error fetching current GA - details:', currentGAError.details)
    }

    // Fetch Google Analytics sessions for previous month
    const { data: previousGA, error: previousGAError } = await adminSupabase
      .from('marketing_metrics')
      .select('hotel_id, value')
      .in('hotel_id', hotelIds)
      .eq('source', 'google_analytics')
      .eq('metric_type', 'sessions')
      .gte('date', previousMonth.start)
      .lte('date', previousMonth.end)

    console.log('📊 Previous GA data:', previousGA ? `${previousGA.length} records` : 'null/undefined')
    if (previousGAError) {
      console.error('❌ Error fetching previous GA - code:', previousGAError.code)
      console.error('❌ Error fetching previous GA - message:', previousGAError.message)
      console.error('❌ Error fetching previous GA - details:', previousGAError.details)
    }

    // Fetch Google Ads and Meta Ads data for current month
    const { data: currentAds, error: currentAdsError } = await adminSupabase
      .from('marketing_metrics')
      .select('hotel_id, value, source')
      .in('hotel_id', hotelIds)
      .in('source', ['google_ads', 'meta_ads'])
      .eq('metric_type', 'spend')
      .gte('date', currentMonth.start)
      .lte('date', currentMonth.end)

    console.log('💰 Current Ads data:', currentAds ? `${currentAds.length} records` : 'null/undefined')
    if (currentAdsError) {
      console.error('❌ Error fetching current ads:', currentAdsError)
    }

    // Fetch Google Ads and Meta Ads data for previous month
    const { data: previousAds, error: previousAdsError } = await adminSupabase
      .from('marketing_metrics')
      .select('hotel_id, value, source')
      .in('hotel_id', hotelIds)
      .in('source', ['google_ads', 'meta_ads'])
      .eq('metric_type', 'spend')
      .gte('date', previousMonth.start)
      .lte('date', previousMonth.end)

    console.log('💰 Previous Ads data:', previousAds ? `${previousAds.length} records` : 'null/undefined')
    if (previousAdsError) {
      console.error('❌ Error fetching previous ads:', previousAdsError)
    }

    // Fetch last sync dates for all hotels (most recent GA session data)
    const lastSyncDates = new Map<string, string>()
    for (const hotelId of hotelIds) {
      const { data: lastSync } = await adminSupabase
        .from('marketing_metrics')
        .select('date')
        .eq('hotel_id', hotelId)
        .eq('source', 'google_analytics')
        .eq('metric_type', 'sessions')
        .order('date', { ascending: false })
        .limit(1)
        .single()

      if (lastSync) {
        lastSyncDates.set(hotelId, lastSync.date)
      }
    }

    // Calculate metrics for each hotel
    const hotels = allHotels.map(hotel => {
      // Calculate sessions from marketing_metrics
      const currentGAForHotel = currentGA?.filter(d => d.hotel_id === hotel.id) || []
      const currentUsers = currentGAForHotel.reduce((sum, d) => sum + (d.value || 0), 0)

      // Debug logging for Hippo Hollow
      if (hotel.name.includes('Hippo')) {
        console.log('🦛 Hippo Hollow current GA records:', currentGAForHotel.length)
        console.log('🦛 Hippo Hollow sessions sum:', currentUsers)
        if (currentGAForHotel.length > 0) {
          console.log('🦛 Sample GA record:', currentGAForHotel[0])
        }
      }

      const previousUsers = previousGA
        ?.filter(d => d.hotel_id === hotel.id)
        .reduce((sum, d) => sum + (d.value || 0), 0) || 0

      const usersChange = previousUsers > 0
        ? ((currentUsers - previousUsers) / previousUsers) * 100
        : 0

      // Calculate ad spend (includes both Google Ads and Meta Ads)
      const currentAdsForHotel = currentAds?.filter(d => d.hotel_id === hotel.id) || []
      const currentAdSpend = currentAdsForHotel.reduce((sum, d) => sum + (d.value || 0), 0)

      const previousAdsForHotel = previousAds?.filter(d => d.hotel_id === hotel.id) || []
      const previousAdSpend = previousAdsForHotel.reduce((sum, d) => sum + (d.value || 0), 0)

      // Debug logging for Hippo Hollow
      if (hotel.name.includes('Hippo')) {
        console.log('🦛 Hippo Hollow current ads records:', currentAdsForHotel.length)
        console.log('🦛 Hippo Hollow ad spend sum:', currentAdSpend)
        if (currentAdsForHotel.length > 0) {
          console.log('🦛 Sample ads record:', currentAdsForHotel[0])
        }
      }

      const adSpendChange = previousAdSpend > 0
        ? ((currentAdSpend - previousAdSpend) / previousAdSpend) * 100
        : 0

      // Calculate direct revenue
      const currentDirectBookings = currentBookings?.filter(
        b => b.hotel_id === hotel.id &&
        (b.channel?.toLowerCase().includes('direct') ||
         b.channel?.toLowerCase().includes('website'))
      ) || []

      const previousDirectBookings = previousBookings?.filter(
        b => b.hotel_id === hotel.id &&
        (b.channel?.toLowerCase().includes('direct') ||
         b.channel?.toLowerCase().includes('website'))
      ) || []

      const currentDirectRevenue = currentDirectBookings.reduce(
        (sum, b) => sum + (b.revenue || 0), 0
      )

      const previousDirectRevenue = previousDirectBookings.reduce(
        (sum, b) => sum + (b.revenue || 0), 0
      )

      const directRevenueChange = previousDirectRevenue > 0
        ? ((currentDirectRevenue - previousDirectRevenue) / previousDirectRevenue) * 100
        : 0

      // Calculate total revenue
      const currentTotalRevenue = currentBookings
        ?.filter(b => b.hotel_id === hotel.id)
        .reduce((sum, b) => sum + (b.revenue || 0), 0) || 0

      const previousTotalRevenue = previousBookings
        ?.filter(b => b.hotel_id === hotel.id)
        .reduce((sum, b) => sum + (b.revenue || 0), 0) || 0

      const totalRevenueChange = previousTotalRevenue > 0
        ? ((currentTotalRevenue - previousTotalRevenue) / previousTotalRevenue) * 100
        : 0

      return {
        id: hotel.id,
        name: hotel.name,
        currentUsers,
        previousUsers,
        usersChange,
        currentAdSpend,
        previousAdSpend,
        adSpendChange,
        currentDirectRevenue,
        previousDirectRevenue,
        directRevenueChange,
        currentTotalRevenue,
        previousTotalRevenue,
        totalRevenueChange,
        currency: hotel.currency || 'USD',
        lastSyncDate: lastSyncDates.get(hotel.id) || null
      }
    })

    // Sort by total revenue (highest first)
    hotels.sort((a, b) => b.currentTotalRevenue - a.currentTotalRevenue)

    return NextResponse.json({
      hotels,
      period: { currentMonth, previousMonth }
    })

  } catch (error) {
    console.error('Reports API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
