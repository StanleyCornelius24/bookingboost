import { NextRequest, NextResponse } from 'next/server'
import { getClientChannelsAnalysis } from '@/lib/client-channels-data'
import { getSelectedHotel } from '@/lib/get-selected-hotel'

export async function GET(request: NextRequest) {
  try {
    // Get date range from query parameters
    const searchParams = request.nextUrl.searchParams
    const selectedHotelId = searchParams.get('hotelId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Get the hotel (selected or fallback to primary)
    const { hotel, error, status } = await getSelectedHotel(selectedHotelId, 'id')

    if (error || !hotel) {
      return NextResponse.json({ error: error || 'Hotel not found' }, { status })
    }

    const hotelRecord = hotel as unknown as { id: string }

    // Fetch client channels analysis
    const data = await getClientChannelsAnalysis(hotelRecord.id, startDate, endDate)

    if (!data) {
      return NextResponse.json({ error: 'Failed to fetch channels data' }, { status: 500 })
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Client channels API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}