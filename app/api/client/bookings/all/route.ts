import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET() {
  const supabase = await createServerClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check for impersonation
  const cookieStore = await cookies()
  const impersonateUserId = cookieStore.get('impersonate_user_id')?.value
  const userId = impersonateUserId || user.id

  // Get hotel
  const { data: hotel } = await supabase
    .from('hotels')
    .select('id, name')
    .eq('user_id', userId)
    .single()

  if (!hotel) {
    return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })
  }

  try {
    // First get the total count
    const { count: totalCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('hotel_id', hotel.id)

    console.log(`Total bookings in database: ${totalCount}`)

    // Fetch ALL bookings in batches (Supabase has 1000 row limit per request)
    const pageSize = 1000
    const totalPages = Math.ceil((totalCount || 0) / pageSize)
    let allBookings: any[] = []

    console.log(`Fetching ${totalPages} pages of ${pageSize} bookings each...`)

    for (let page = 0; page < totalPages; page++) {
      const from = page * pageSize
      const to = from + pageSize - 1

      const { data, error } = await supabase
        .from('bookings')
        .select('*, hotels(name)')
        .eq('hotel_id', hotel.id)
        .order('booking_date', { ascending: false })
        .range(from, to)

      if (error) {
        console.error(`Error fetching page ${page + 1}:`, error)
        return NextResponse.json(
          { error: 'Failed to fetch bookings' },
          { status: 500 }
        )
      }

      if (data) {
        allBookings = [...allBookings, ...data]
        console.log(`Fetched page ${page + 1}/${totalPages}: ${data.length} bookings (total so far: ${allBookings.length})`)
      }
    }

    const bookings = allBookings

    console.log(`Total bookings in database (count query): ${totalCount}`)
    console.log(`Total bookings fetched: ${bookings?.length || 0}`)
    console.log(`Hotel ID: ${hotel.id}`)

    if (totalCount && bookings && totalCount !== bookings.length) {
      console.warn(`WARNING: Database has ${totalCount} bookings but only fetched ${bookings.length}!`)
    }

    // Log date ranges
    if (bookings && bookings.length > 0) {
      const bookingDates = bookings.map(b => b.booking_date).filter(Boolean).sort()
      const checkinDates = bookings.map(b => b.checkin_date).filter(Boolean).sort()

      console.log('Booking date range:', {
        earliest: bookingDates[0],
        latest: bookingDates[bookingDates.length - 1]
      })

      console.log('Check-in date range:', {
        earliest: checkinDates[0],
        latest: checkinDates[checkinDates.length - 1]
      })

      // Check for November 2025 bookings specifically
      const nov2025Bookings = bookings.filter(b =>
        b.booking_date && b.booking_date.startsWith('2025-11')
      )
      const nov2025Checkins = bookings.filter(b =>
        b.checkin_date && b.checkin_date.startsWith('2025-11')
      )

      console.log('November 2025 stats:', {
        bookingsWithBookingDateInNov: nov2025Bookings.length,
        bookingsWithCheckinDateInNov: nov2025Checkins.length
      })

      // Check for August 2025+ bookings
      const aug2025PlusBookings = bookings.filter(b =>
        b.booking_date && b.booking_date >= '2025-08-01'
      )
      const aug2025PlusCheckins = bookings.filter(b =>
        b.checkin_date && b.checkin_date >= '2025-08-01'
      )

      console.log('August 2025+ stats:', {
        bookingsWithBookingDateAug2025Plus: aug2025PlusBookings.length,
        bookingsWithCheckinDateAug2025Plus: aug2025PlusCheckins.length
      })
    }

    return NextResponse.json({
      bookings: bookings || [],
      total: bookings?.length || 0,
      totalInDatabase: totalCount || 0,
      hotelName: hotel.name
    })
  } catch (error: any) {
    console.error('Bookings fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}
