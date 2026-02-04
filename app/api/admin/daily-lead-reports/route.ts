import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getSelectedHotel } from '@/lib/get-selected-hotel'

/**
 * Daily Lead Reports API - Admin Only
 *
 * GET - Fetch recent daily reports
 */

/**
 * GET /api/admin/daily-lead-reports
 * Query params:
 * - hotelId: Hotel ID
 * - days: Number of days to look back (default: 30)
 * - limit: Number of results (default: 30)
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const selectedHotelId = searchParams.get('hotelId')
    const days = parseInt(searchParams.get('days') || '30')
    const limit = parseInt(searchParams.get('limit') || '30')

    // Get the hotel
    const { hotel, error: hotelError, status } = await getSelectedHotel(
      selectedHotelId,
      'id, name'
    )

    if (hotelError || !hotel) {
      return NextResponse.json(
        { error: hotelError || 'Hotel not found' },
        { status }
      )
    }

    const hotelRecord = hotel as unknown as { id: string; name: string }

    // Calculate date range
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateStr = startDate.toISOString().split('T')[0]

    // Fetch reports
    const { data: reports, error } = await supabase
      .from('daily_lead_reports')
      .select('*')
      .eq('hotel_id', hotelRecord.id)
      .gte('report_date', startDateStr)
      .order('report_date', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching reports:', error)
      return NextResponse.json(
        { error: 'Failed to fetch reports' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      reports: reports || [],
      hotel: {
        id: hotelRecord.id,
        name: hotelRecord.name,
      },
    })
  } catch (error: any) {
    console.error('Reports fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
