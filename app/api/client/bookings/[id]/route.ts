import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getSelectedHotel } from '@/lib/get-selected-hotel'

// Update a booking
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerClient()
  const { id } = await params

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Parse the request body
    const body = await request.json()
    const {
      booking_date,
      checkin_date,
      checkout_date,
      channel,
      guest_name,
      revenue,
      nights,
      status,
      commission_rate,
      commission_amount,
      hotelId
    } = body

    // Get the hotel to verify access
    const { hotel, error: hotelError, status: hotelStatus } = await getSelectedHotel(hotelId, 'id')

    if (hotelError || !hotel) {
      return NextResponse.json({ error: hotelError || 'Hotel not found' }, { status: hotelStatus })
    }

    const hotelRecord = hotel as unknown as { id: string }

    // First verify the booking belongs to this hotel
    const { data: existingBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('hotel_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (existingBooking.hotel_id !== hotelRecord.id) {
      return NextResponse.json({ error: 'Unauthorized to edit this booking' }, { status: 403 })
    }

    // Build the update object with only provided fields
    const updateData: Record<string, unknown> = {}
    if (booking_date !== undefined) updateData.booking_date = booking_date
    if (checkin_date !== undefined) updateData.checkin_date = checkin_date
    if (checkout_date !== undefined) updateData.checkout_date = checkout_date
    if (channel !== undefined) updateData.channel = channel
    if (guest_name !== undefined) updateData.guest_name = guest_name
    if (revenue !== undefined) updateData.revenue = revenue
    if (nights !== undefined) updateData.nights = nights
    if (status !== undefined) updateData.status = status
    if (commission_rate !== undefined) updateData.commission_rate = commission_rate
    if (commission_amount !== undefined) updateData.commission_amount = commission_amount

    // Update the booking
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Update booking error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update booking' },
        { status: 500 }
      )
    }

    return NextResponse.json({ booking: updatedBooking })
  } catch (error) {
    console.error('Update booking error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update booking' },
      { status: 500 }
    )
  }
}

// Delete a booking
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerClient()
  const { id } = await params

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get hotelId from query parameter
    const { searchParams } = new URL(request.url)
    const selectedHotelId = searchParams.get('hotelId')

    // Get the hotel to verify access
    const { hotel, error: hotelError, status: hotelStatus } = await getSelectedHotel(selectedHotelId, 'id')

    if (hotelError || !hotel) {
      return NextResponse.json({ error: hotelError || 'Hotel not found' }, { status: hotelStatus })
    }

    const hotelRecord = hotel as unknown as { id: string }

    // First verify the booking belongs to this hotel
    const { data: existingBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('hotel_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (existingBooking.hotel_id !== hotelRecord.id) {
      return NextResponse.json({ error: 'Unauthorized to delete this booking' }, { status: 403 })
    }

    // Delete the booking
    const { error: deleteError } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Delete booking error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete booking' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete booking error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete booking' },
      { status: 500 }
    )
  }
}
