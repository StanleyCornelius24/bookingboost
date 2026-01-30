import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getSelectedHotel } from '@/lib/get-selected-hotel'

export async function GET(request: NextRequest) {
  const supabase = await createServerClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get selected hotel ID from query parameter
  const { searchParams } = new URL(request.url)
  const selectedHotelId = searchParams.get('hotelId')

  // Get the hotel (selected or fallback to primary)
  const { hotel, error: hotelError, status } = await getSelectedHotel(selectedHotelId, 'id, name')

  if (hotelError || !hotel) {
    return NextResponse.json({ error: hotelError || 'Hotel not found' }, { status })
  }

  const hotelRecord = hotel as unknown as { id: string; name: string }

  try {
    // First get the total count
    const { count: totalCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('hotel_id', hotelRecord.id)

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
        .eq('hotel_id', hotelRecord.id)
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
    console.log(`Hotel ID: ${hotelRecord.id}`)

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
      hotelName: hotelRecord.name
    })
  } catch (error: any) {
    console.error('Bookings fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}
