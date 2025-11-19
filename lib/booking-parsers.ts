import { COMMISSION_RATES } from './constants'

export interface BookingRecord {
  hotel_id: string
  booking_date: string
  checkin_date?: string
  checkout_date?: string
  channel: string
  guest_name?: string
  revenue: number
  nights?: number
  status?: string
  commission_rate: number
  commission_amount: number
  adults?: number
  children?: number
  room_name?: string
  company?: string
  extras?: number
  booking_reference?: string
  invoice_number?: string
  currency?: string
  exchange_rate?: number
}

export interface FormatDetectionResult {
  format: 'siteminder' | 'nightsbridge' | 'unknown'
  confidence: number
  headers: string[]
}

// Define expected headers for each format
const SITEMINDER_HEADERS = [
  'Booking status',
  'Channel',
  'Total price',
  'Check-in',
  'Check-out',
  'Guest names',
  'Booked-on date',
  'Booking reference'  // Added for newer SiteMinder exports
]

const NIGHTSBRIDGE_HEADERS = [
  'Booking ID',
  'Arrival Date',
  'Last Night',
  'Guest Name',
  'Revenue',
  'Source',
  'Made By',
  'Booking Date',
  'Status',
  'Nights',
  'Commission',
  'Nett'
]

/**
 * Detect the CSV format based on headers
 */
export function detectFormat(headers: string[]): FormatDetectionResult {
  const headerSet = new Set(headers.map(h => h.trim()))

  // Check SiteMinder format
  const siteminderMatches = SITEMINDER_HEADERS.filter(header => headerSet.has(header))
  const siteminderConfidence = siteminderMatches.length / SITEMINDER_HEADERS.length

  // Check NightsBridge format
  const nightsbridgeMatches = NIGHTSBRIDGE_HEADERS.filter(header => headerSet.has(header))
  const nightsbridgeConfidence = nightsbridgeMatches.length / NIGHTSBRIDGE_HEADERS.length

  if (siteminderConfidence >= 0.6 && siteminderConfidence > nightsbridgeConfidence) {
    return {
      format: 'siteminder',
      confidence: siteminderConfidence,
      headers
    }
  } else if (nightsbridgeConfidence >= 0.6) {
    return {
      format: 'nightsbridge',
      confidence: nightsbridgeConfidence,
      headers
    }
  } else {
    return {
      format: 'unknown',
      confidence: Math.max(siteminderConfidence, nightsbridgeConfidence),
      headers
    }
  }
}

/**
 * Parse SiteMinder booking records
 */
export function parseSiteMinderRecord(
  record: any,
  hotelId: string,
  commissionRates: Record<string, number> = COMMISSION_RATES
): BookingRecord {
  // Extract channel name and normalize it
  let channel = record['Channel'] || record['Source'] || 'Other'

  // Normalize channel names based on SiteMinder format
  const channelLower = channel.toLowerCase()

  if (channelLower.includes('booking.com') || channelLower === 'bdc') {
    channel = 'Booking.com'
  } else if (channelLower.includes('expedia')) {
    channel = 'Expedia'
  } else if (channelLower.includes('direct')) {
    channel = 'Direct Booking'
  } else if (channelLower.includes('hotelbeds')) {
    channel = 'Hotelbeds'
  } else if (channelLower.includes('followme2africa')) {
    channel = 'followme2AFRICA'
  } else if (channelLower.includes('tourplan')) {
    channel = 'Tourplan'
  } else if (channelLower.includes('thompsons holidays')) {
    channel = 'Thompsons Holidays'
  } else if (channelLower.includes('holiday travel group')) {
    channel = 'Holiday Travel Group'
  } else if (channelLower.includes('thompsons africa')) {
    channel = 'Thompsons Africa (New)'
  }

  // Parse price - SiteMinder format is "ZAR 11493.00"
  const priceString = record['Total price'] || record['Revenue'] || '0'
  const revenue = parseFloat(priceString.replace(/[^0-9.-]/g, ''))

  // Calculate nights from check-in and check-out
  const checkinDate = record['Check-in'] || record['Checkin Date'] || null
  const checkoutDate = record['Check-out'] || record['Checkout Date'] || null
  let nights = 1

  if (checkinDate && checkoutDate) {
    const checkin = new Date(checkinDate)
    const checkout = new Date(checkoutDate)
    nights = Math.ceil((checkout.getTime() - checkin.getTime()) / (1000 * 60 * 60 * 24))
  }

  // Get booking date from "Booked-on date" field
  let bookingDate = record['Booked-on date'] || record['Booking Date'] || record['Created'] || record['Booked on date']

  // Handle different date formats and ensure we have a valid date
  if (bookingDate && typeof bookingDate === 'string') {
    bookingDate = bookingDate.trim()

    // Only proceed if we have a non-empty string after trimming
    if (bookingDate.length > 0) {
      // Handle formats like "2024-01-15 10:30:00" or "15/01/2024"
      if (bookingDate.includes(' ')) {
        bookingDate = bookingDate.split(' ')[0].trim()
      }
      // Convert DD/MM/YYYY to YYYY-MM-DD if needed
      if (bookingDate.includes('/')) {
        const parts = bookingDate.split('/')
        if (parts.length === 3 && parts[0].length <= 2) {
          // Assuming DD/MM/YYYY format
          bookingDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
        }
      }
    } else {
      // Empty string after trim, treat as null
      bookingDate = ''
    }
  }

  // If still no valid booking date, use fallbacks
  if (!bookingDate || bookingDate.trim().length === 0) {
    // Try check-in date first
    if (checkinDate && typeof checkinDate === 'string' && checkinDate.trim().length > 0) {
      bookingDate = checkinDate.trim()
    } else {
      // Last resort: use current date
      bookingDate = new Date().toISOString().split('T')[0]
    }
  }

  // Final validation to ensure we have a valid date string
  if (!bookingDate || bookingDate.trim().length === 0) {
    bookingDate = new Date().toISOString().split('T')[0]
  }

  const commissionRate = commissionRates[channel] || commissionRates['Other'] || 0.10
  const commissionAmount = revenue * commissionRate

  // Try to get guest name from various possible fields
  let guestName = record['Guest names'] || record['Guest name']
  if (!guestName && record['Guest first name'] && record['Guest last name']) {
    guestName = `${record['Guest first name']} ${record['Guest last name']}`
  }

  return {
    hotel_id: hotelId,
    booking_date: bookingDate,
    checkin_date: checkinDate,
    checkout_date: checkoutDate,
    channel,
    guest_name: guestName || undefined,
    revenue,
    nights,
    status: record['Booking status'] || record['Status'] || 'Confirmed',
    commission_rate: commissionRate,
    commission_amount: commissionAmount,
    booking_reference: record['Booking reference'] || record['Booking ID'] || record['Confirmation number'] || undefined,
    currency: record['Currency'] || 'ZAR',
  }
}

/**
 * Parse NightsBridge booking records
 */
export function parseNightsBridgeRecord(
  record: any,
  hotelId: string,
  commissionRates: Record<string, number> = COMMISSION_RATES
): BookingRecord {
  // Extract and normalize channel from Source field
  let channel = record['Source'] || record['Made By'] || 'Other'

  // Normalize NightsBridge source names to match our standard channels
  const channelLower = channel.toLowerCase()

  if (channelLower.includes('booking.com') || channelLower.includes('booking')) {
    channel = 'Booking.com'
  } else if (channelLower.includes('expedia')) {
    channel = 'Expedia'
  } else if (channelLower.includes('direct') || channelLower.includes('phone') || channelLower.includes('walk-in')) {
    channel = 'Direct Booking'
  } else if (channelLower.includes('airbnb')) {
    channel = 'Airbnb'
  } else if (channelLower.includes('agoda')) {
    channel = 'Agoda'
  } else if (channelLower.includes('hotels.com')) {
    channel = 'Hotels.com'
  } else if (channelLower.includes('hotelbeds')) {
    channel = 'Hotelbeds'
  } else if (channelLower.includes('sabre')) {
    channel = 'Sabre'
  } else if (channelLower.includes('amadeus')) {
    channel = 'Amadeus'
  } else if (channelLower.includes('followme2africa')) {
    channel = 'followme2AFRICA'
  } else if (channelLower.includes('tourplan')) {
    channel = 'Tourplan'
  } else if (channelLower.includes('thompsons')) {
    channel = 'Thompsons Holidays'
  }

  // Parse revenue - NightsBridge format might be "1234.56" or include currency
  const revenueString = record['Revenue'] || record['Nett'] || '0'
  const revenue = parseFloat(revenueString.toString().replace(/[^0-9.-]/g, ''))

  // Parse dates - NightsBridge uses "Arrival Date" and "Last Night"
  const arrivalDate = record['Arrival Date'] || null
  const lastNight = record['Last Night'] || null

  // Calculate checkout date (Last Night + 1 day)
  let checkoutDate: string | undefined = undefined
  if (lastNight) {
    const lastNightDate = new Date(lastNight)
    lastNightDate.setDate(lastNightDate.getDate() + 1)
    checkoutDate = lastNightDate.toISOString().split('T')[0]
  }

  // Calculate nights
  const nights = parseInt(record['Nights']?.toString() || '1') || 1

  // Parse booking date
  const bookingDate = record['Booking Date'] || new Date().toISOString().split('T')[0]

  // Calculate commission
  const commissionString = record['Commission'] || '0'
  let commissionAmount = parseFloat(commissionString.toString().replace(/[^0-9.-]/g, ''))

  // If no commission in file, calculate based on our rates
  if (commissionAmount === 0) {
    const commissionRate = commissionRates[channel] || commissionRates['Other'] || 0.10
    commissionAmount = revenue * commissionRate
  }

  const commissionRate = revenue > 0 ? commissionAmount / revenue : 0

  // Parse additional NightsBridge fields
  const adults = parseInt(record['Adults']?.toString() || '0') || 0
  const children = parseInt(record['Children']?.toString() || '0') || 0
  const extrasString = record['Extras'] || '0'
  const extras = parseFloat(extrasString.toString().replace(/[^0-9.-]/g, '')) || 0
  const exchangeRate = parseFloat(record['Exchange Rate']?.toString() || '1') || 1

  return {
    hotel_id: hotelId,
    booking_date: bookingDate.split(' ')[0], // Extract just the date part
    checkin_date: arrivalDate,
    checkout_date: checkoutDate,
    channel,
    guest_name: record['Guest Name'] || undefined,
    revenue,
    nights,
    status: record['Status'] || 'Confirmed',
    commission_rate: commissionRate,
    commission_amount: commissionAmount,
    adults: adults > 0 ? adults : undefined,
    children: children > 0 ? children : undefined,
    room_name: record['Room Name'] || undefined,
    company: record['Company'] || undefined,
    extras: extras > 0 ? extras : undefined,
    booking_reference: record['Booking ID'] || record['NBID'] || undefined,
    invoice_number: record['Invoice No.'] || undefined,
    currency: record['Currency'] || 'ZAR',
    exchange_rate: exchangeRate !== 1 ? exchangeRate : undefined,
  }
}

/**
 * Filter out cancelled bookings
 */
export function isValidBooking(record: any): boolean {
  const status = record['Booking status'] || record['Status'] || ''
  const statusLower = status.toLowerCase()

  // Filter out cancelled, no-show, and invalid bookings
  return !statusLower.includes('cancelled') &&
         !statusLower.includes('cancel') &&
         !statusLower.includes('no-show') &&
         !statusLower.includes('noshow')
}

/**
 * Parse booking records based on detected format
 */
export function parseBookingRecords(
  records: any[],
  format: 'siteminder' | 'nightsbridge',
  hotelId: string,
  commissionRates: Record<string, number> = COMMISSION_RATES
): BookingRecord[] {
  return records
    .filter(isValidBooking)
    .map(record => {
      if (format === 'siteminder') {
        return parseSiteMinderRecord(record, hotelId, commissionRates)
      } else {
        return parseNightsBridgeRecord(record, hotelId, commissionRates)
      }
    })
    .filter(booking => booking.revenue > 0) // Only include bookings with revenue
}