import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { GoogleAdsApi } from 'google-ads-api'

export async function GET() {
  const supabaseAuth = await createServerClient()

  // Check auth
  const {
    data: { session },
  } = await supabaseAuth.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check for admin role
  const cookieStore = await cookies()
  const impersonateUserId = cookieStore.get('impersonate_user_id')?.value
  const userId = impersonateUserId || session.user.id

  const { data: hotels } = await supabaseAuth
    .from('hotels')
    .select('user_role')
    .eq('user_id', userId)
    .order('is_primary', { ascending: false })
    .limit(1)

  const userRole = hotels?.[0]?.user_role

  if (userRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
  }

  // User is confirmed admin - use service role key to bypass RLS
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // Get all hotels
    const { data: allHotels, error: hotelsError } = await supabase
      .from('hotels')
      .select('*')
      .order('name')

    if (hotelsError) {
      console.error('Error fetching hotels:', hotelsError)
      return NextResponse.json({ error: 'Failed to fetch hotels' }, { status: 500 })
    }

    // Get a reference token to use as fallback for all hotels
    // Query with service role (should bypass RLS)
    console.log('Fetching fallback Google token with service role...')

    const { data: directTokens, error: directError } = await supabase
      .from('api_tokens')
      .select('*')
      .eq('service', 'google')
      .order('created_at', { ascending: false })
      .limit(1)

    let adminGoogleToken = null

    console.log(`Token query result - count: ${directTokens?.length || 0}, error: ${directError ? 'YES' : 'NO'}`)

    if (directError) {
      console.error('❌ ERROR querying api_tokens table:')
      console.error('Error code:', directError.code)
      console.error('Error message:', directError.message)
      console.error('Error details:', directError.details)
      console.error('Full error:', JSON.stringify(directError, null, 2))
      console.log(`⚠ No Google tokens found - query failed due to RLS policy or permissions`)
    } else if (directTokens && directTokens.length > 0) {
      adminGoogleToken = directTokens[0]
      const { data: hotelData } = await supabase
        .from('hotels')
        .select('name')
        .eq('id', adminGoogleToken.hotel_id)
        .single()

      const hotelName = hotelData?.name || 'Unknown'
      console.log(`🔑 Admin dashboard using fallback tokens from: ${hotelName}`)
      console.log(`✓ Fallback token found (created: ${new Date(adminGoogleToken.created_at).toLocaleDateString()})`)
    } else {
      console.log(`⚠ No Google tokens found - query returned empty`)
    }

    // Calculate date ranges for previous two complete months
    // Show last complete month vs the month before it
    const now = new Date()

    // December 2025 (last complete month)
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1) // Dec 1
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0) // Dec 31 (day 0 of Jan = last day of Dec)

    // November 2025 (month before last)
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 2, 1) // Nov 1
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0) // Nov 30 (day 0 of Dec = last day of Nov)

    // Format date without timezone issues
    const formatDate = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    console.log('Date ranges for dashboard:')
    console.log('Current month:', formatDate(currentMonthStart), 'to', formatDate(currentMonthEnd))
    console.log('Previous month:', formatDate(previousMonthStart), 'to', formatDate(previousMonthEnd))

    // Test: Check total bookings count across all hotels
    const { count: totalBookings, error: countError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .gte('booking_date', formatDate(currentMonthStart))
      .lte('booking_date', formatDate(currentMonthEnd))

    console.log(`Total bookings in Dec 2025 visible to this user: ${totalBookings}`)
    if (countError) {
      console.error('Error counting bookings:', countError)
    }

    // Fetch data for each hotel
    const hotelsWithMetrics = await Promise.all(
      allHotels.map(async (hotel) => {
        try {
          // Fetch bookings for current and previous month
          const { data: currentBookings, error: currentError } = await supabase
            .from('bookings')
            .select('channel, revenue, commission_amount')
            .eq('hotel_id', hotel.id)
            .gte('booking_date', formatDate(currentMonthStart))
            .lte('booking_date', formatDate(currentMonthEnd))

          const { data: previousBookings, error: previousError } = await supabase
            .from('bookings')
            .select('channel, revenue, commission_amount')
            .eq('hotel_id', hotel.id)
            .gte('booking_date', formatDate(previousMonthStart))
            .lte('booking_date', formatDate(previousMonthEnd))

          if (currentError) {
            console.error(`Error fetching current bookings for ${hotel.name}:`, currentError)
          }
          if (previousError) {
            console.error(`Error fetching previous bookings for ${hotel.name}:`, previousError)
          }

          // Calculate direct revenue (bookings with channel containing "direct" or "own web site")
          const calculateDirectRevenue = (bookings: any[]) => {
            return bookings
              ?.filter(b => {
                const channel = b.channel?.toLowerCase() || ''
                return channel.includes('direct') || channel === 'own web site' || b.commission_amount === 0
              })
              .reduce((sum, b) => sum + (b.revenue || 0), 0) || 0
          }

          // Calculate total revenue
          const calculateTotalRevenue = (bookings: any[]) => {
            return bookings?.reduce((sum, b) => sum + (b.revenue || 0), 0) || 0
          }

          const currentDirectRevenue = calculateDirectRevenue(currentBookings || [])
          const previousDirectRevenue = calculateDirectRevenue(previousBookings || [])
          const currentTotalRevenue = calculateTotalRevenue(currentBookings || [])
          const previousTotalRevenue = calculateTotalRevenue(previousBookings || [])

          // Debug logging for first hotel
          if (hotel.id === allHotels[0].id) {
            console.log(`\n=== ${hotel.name} Revenue Debug ===`)
            console.log(`Current bookings (${formatDate(currentMonthStart)} to ${formatDate(currentMonthEnd)}):`, currentBookings?.length || 0)
            console.log(`Previous bookings (${formatDate(previousMonthStart)} to ${formatDate(previousMonthEnd)}):`, previousBookings?.length || 0)
            if (currentBookings && currentBookings.length > 0) {
              console.log('Sample current booking:', currentBookings[0])
            }
            console.log(`Current direct revenue:`, currentDirectRevenue)
            console.log(`Previous direct revenue:`, previousDirectRevenue)
            console.log(`Current total revenue:`, currentTotalRevenue)
            console.log(`Previous total revenue:`, previousTotalRevenue)
            console.log(`===========================\n`)
          }

          // Fetch Google Ads spend (if available)
          let currentAdSpend = 0
          let previousAdSpend = 0

          if (hotel.google_ads_customer_id && process.env.GOOGLE_ADS_DEVELOPER_TOKEN) {
            try {
              // Get access token for this hotel, with fallback to admin token
              // Use service role client for token queries
              const { data: hotelToken } = await supabase
                .from('api_tokens')
                .select('access_token, refresh_token')
                .eq('hotel_id', hotel.id)
                .eq('service', 'google')
                .maybeSingle()

              // Use hotel token if available, otherwise fall back to admin token
              const tokenData = hotelToken || adminGoogleToken

              if (tokenData) {
                // Set up Google Ads API client
                const client = new GoogleAdsApi({
                  client_id: process.env.GOOGLE_CLIENT_ID!,
                  client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
                })

                const customer = client.Customer({
                  customer_id: hotel.google_ads_customer_id,
                  login_customer_id: hotel.google_ads_manager_id || undefined,
                  refresh_token: tokenData.refresh_token,
                })

                // Query current month ad spend
                const currentQuery = `
                  SELECT
                    metrics.cost_micros
                  FROM campaign
                  WHERE segments.date >= '${formatDate(currentMonthStart).replace(/-/g, '')}'
                    AND segments.date <= '${formatDate(currentMonthEnd).replace(/-/g, '')}'
                `

                const currentResults = await customer.query(currentQuery)
                currentAdSpend = currentResults.reduce((sum: number, row: any) => {
                  return sum + (Number(row.metrics?.cost_micros || 0) / 1000000)
                }, 0)

                // Query previous month ad spend
                const previousQuery = `
                  SELECT
                    metrics.cost_micros
                  FROM campaign
                  WHERE segments.date >= '${formatDate(previousMonthStart).replace(/-/g, '')}'
                    AND segments.date <= '${formatDate(previousMonthEnd).replace(/-/g, '')}'
                `

                const previousResults = await customer.query(previousQuery)
                previousAdSpend = previousResults.reduce((sum: number, row: any) => {
                  return sum + (Number(row.metrics?.cost_micros || 0) / 1000000)
                }, 0)

                const tokenSource = hotelToken ? 'hotel token' : 'admin fallback token'
                console.log(`✓ ${hotel.name} ad spend (using ${tokenSource}) - Current: $${currentAdSpend.toFixed(2)}, Previous: $${previousAdSpend.toFixed(2)}`)
              } else {
                console.log(`⚠ ${hotel.name} - No Google token available (ad spend will be $0)`)
              }
            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : String(error)
              if (errorMsg.includes('invalid_grant')) {
                console.error(`⚠ ${hotel.name} - Google OAuth token expired (ad spend will be $0)`)
              } else {
                console.error(`❌ ${hotel.name} - Google Ads API error: ${errorMsg}`)
              }
            }
          }

          // Fetch sessions from GA (stored in DB)
          // Note: We use sessions instead of users because sessions can be summed across days
          // Users would be double-counted (same user on multiple days)
          let currentSessions = 0
          let previousSessions = 0

          if (hotel.google_analytics_property_id) {
            try {
              // Get sessions from cached metrics
              const { data: currentMetrics } = await supabase
                .from('hotel_metrics')
                .select('sessions')
                .eq('hotel_id', hotel.id)
                .gte('date', formatDate(currentMonthStart))
                .lte('date', formatDate(currentMonthEnd))

              const { data: previousMetrics } = await supabase
                .from('hotel_metrics')
                .select('sessions')
                .eq('hotel_id', hotel.id)
                .gte('date', formatDate(previousMonthStart))
                .lte('date', formatDate(previousMonthEnd))

              currentSessions = currentMetrics?.reduce((sum, m) => sum + (m.sessions || 0), 0) || 0
              previousSessions = previousMetrics?.reduce((sum, m) => sum + (m.sessions || 0), 0) || 0
            } catch (error) {
              console.error(`Error fetching metrics for ${hotel.name}:`, error)
            }
          }

          // Calculate percentage changes
          const calculatePercentageChange = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0
            return ((current - previous) / previous) * 100
          }

          return {
            id: hotel.id,
            name: hotel.name,
            currentUsers: currentSessions,
            previousUsers: previousSessions,
            usersChange: calculatePercentageChange(currentSessions, previousSessions),
            currentAdSpend,
            previousAdSpend,
            adSpendChange: calculatePercentageChange(currentAdSpend, previousAdSpend),
            currentDirectRevenue,
            previousDirectRevenue,
            directRevenueChange: calculatePercentageChange(currentDirectRevenue, previousDirectRevenue),
            currentTotalRevenue,
            previousTotalRevenue,
            totalRevenueChange: calculatePercentageChange(currentTotalRevenue, previousTotalRevenue),
            currency: hotel.currency || 'USD'
          }
        } catch (error) {
          console.error(`Error processing hotel ${hotel.name}:`, error)
          return {
            id: hotel.id,
            name: hotel.name,
            currentUsers: 0,
            previousUsers: 0,
            usersChange: 0,
            currentAdSpend: 0,
            previousAdSpend: 0,
            adSpendChange: 0,
            currentDirectRevenue: 0,
            previousDirectRevenue: 0,
            directRevenueChange: 0,
            currentTotalRevenue: 0,
            previousTotalRevenue: 0,
            totalRevenueChange: 0,
            currency: hotel.currency || 'USD'
          }
        }
      })
    )

    return NextResponse.json({
      hotels: hotelsWithMetrics,
      period: {
        currentMonth: {
          start: formatDate(currentMonthStart),
          end: formatDate(currentMonthEnd)
        },
        previousMonth: {
          start: formatDate(previousMonthStart),
          end: formatDate(previousMonthEnd)
        }
      }
    })
  } catch (error) {
    console.error('Error in admin dashboard overview:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
