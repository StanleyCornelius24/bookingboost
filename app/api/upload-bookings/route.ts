import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { parse } from 'csv-parse/sync'
import { detectFormat, parseBookingRecords } from '@/lib/booking-parsers'
import { COMMISSION_RATES } from '@/lib/constants'
import { getSelectedHotel } from '@/lib/get-selected-hotel'

export async function POST(request: Request) {
  const supabase = await createServerClient()

  // Check auth
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get hotelId and file from form data
    const formData = await request.formData()
    const selectedHotelId = formData.get('hotelId') as string | null
    const file = formData.get('file') as File

    // Get the hotel (selected or fallback to primary)
    const { hotel, error: hotelError, status } = await getSelectedHotel(selectedHotelId, '*')

    if (hotelError || !hotel) {
      return NextResponse.json({ error: hotelError || 'Hotel not found' }, { status })
    }

    const hotelRecord = hotel as unknown as { id: string }

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const csvText = await file.text()

    // Parse CSV
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
    })

    console.log('Parsed records:', records.length)
    console.log('Sample record:', records[0])

    if (records.length === 0) {
      return NextResponse.json({ error: 'No valid records found in CSV' }, { status: 400 })
    }

    // Detect format based on headers
    const headers = Object.keys(records[0] as Record<string, any>)
    const formatDetection = detectFormat(headers)

    console.log('Format detection:', formatDetection)

    if (formatDetection.format === 'unknown') {
      return NextResponse.json({
        error: 'Unsupported CSV format. Please use SiteMinder or NightsBridge export format.',
        detectedHeaders: headers,
        confidence: formatDetection.confidence
      }, { status: 400 })
    }

    // Get custom commission rates for this hotel
    const { data: customRates } = await supabase
      .from('commission_rates')
      .select('channel_name, commission_rate')
      .eq('hotel_id', hotelRecord.id)
      .eq('is_active', true)

    // Build commission rates map
    let commissionRates = { ...COMMISSION_RATES }
    if (customRates && customRates.length > 0) {
      customRates.forEach(rate => {
        commissionRates[rate.channel_name] = rate.commission_rate
      })
    }

    // Parse records using the appropriate parser with custom rates
    const bookings = parseBookingRecords(records, formatDetection.format, hotelRecord.id, commissionRates)

    // Extract unique channels from parsed bookings
    const channelsInUpload = [...new Set(bookings.map(booking => booking.channel))]

    // Find channels that don't exist in commission_rates table
    const existingChannels = customRates?.map(rate => rate.channel_name) || []
    const newChannels = channelsInUpload.filter(channel =>
      !existingChannels.includes(channel) &&
      !Object.keys(COMMISSION_RATES).includes(channel)
    )

    // Auto-create commission rates for new channels with default 10% rate
    if (newChannels.length > 0) {
      const newCommissionRates = newChannels.map(channel => ({
        hotel_id: hotelRecord.id,
        channel_name: channel,
        commission_rate: 0.10, // 10% default for unknown suppliers
        is_active: true
      }))

      await supabase
        .from('commission_rates')
        .insert(newCommissionRates)
        .select()

      console.log(`Auto-created commission rates for new channels: ${newChannels.join(', ')}`)
    }

    // Get all booking references from the upload
    const bookingReferences = bookings.map(b => b.booking_reference).filter(Boolean)

    // Fetch existing bookings with these references
    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('hotel_id', hotelRecord.id)
      .in('booking_reference', bookingReferences)

    // Create a map of existing bookings by reference
    const existingBookingsMap = new Map()
    existingBookings?.forEach(booking => {
      existingBookingsMap.set(booking.booking_reference, booking)
    })

    // Categorize bookings: new, update, or skip
    const newBookings: any[] = []
    const updatedBookings: any[] = []
    const skippedBookings: any[] = []

    bookings.forEach(booking => {
      const existing = existingBookingsMap.get(booking.booking_reference)

      if (!existing) {
        // New booking
        newBookings.push(booking)
      } else {
        // Check if booking details have changed
        const hasChanged =
          existing.revenue !== booking.revenue ||
          existing.nights !== booking.nights ||
          existing.checkin_date !== booking.checkin_date ||
          existing.checkout_date !== booking.checkout_date ||
          existing.booking_date !== booking.booking_date ||
          existing.channel !== booking.channel ||
          existing.commission_rate !== booking.commission_rate ||
          existing.commission_amount !== booking.commission_amount

        if (hasChanged) {
          // Update existing booking
          updatedBookings.push({ ...booking, id: existing.id })
        } else {
          // Skip - exact duplicate
          skippedBookings.push(booking)
        }
      }
    })

    // Insert new bookings
    let insertedCount = 0
    if (newBookings.length > 0) {
      const { data: insertedData, error: insertError } = await supabase
        .from('bookings')
        .insert(newBookings)
        .select()

      if (insertError) {
        console.error('Insert error:', insertError)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
      insertedCount = insertedData?.length || 0
    }

    // Update changed bookings
    let updatedCount = 0
    if (updatedBookings.length > 0) {
      for (const booking of updatedBookings) {
        const { id, ...updateData } = booking
        const { error: updateError } = await supabase
          .from('bookings')
          .update(updateData)
          .eq('id', id)

        if (updateError) {
          console.error('Update error:', updateError)
        } else {
          updatedCount++
        }
      }
    }

    return NextResponse.json({
      success: true,
      total: bookings.length,
      new: insertedCount,
      updated: updatedCount,
      skipped: skippedBookings.length,
      format: formatDetection.format,
      confidence: formatDetection.confidence,
      totalRevenue: bookings.reduce((sum, b) => sum + b.revenue, 0),
      totalCommission: bookings.reduce((sum, b) => sum + b.commission_amount, 0),
      message: `Processed ${bookings.length} bookings: ${insertedCount} new, ${updatedCount} updated, ${skippedBookings.length} skipped (duplicates)`,
      newChannelsDetected: newChannels.length > 0 ? newChannels : undefined,
      newChannelsMessage: newChannels.length > 0
        ? `Found ${newChannels.length} new supplier(s): ${newChannels.join(', ')}. Default commission rate of 10% applied. You can adjust these rates in Commission Management.`
        : undefined
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process file' },
      { status: 500 }
    )
  }
}