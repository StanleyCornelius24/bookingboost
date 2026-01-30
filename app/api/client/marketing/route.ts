import { NextRequest, NextResponse } from 'next/server'
import { getMarketingAnalysis } from '@/lib/marketing-analysis-server'
import { getSelectedHotel } from '@/lib/get-selected-hotel'

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const selectedHotelId = searchParams.get('hotelId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Get the hotel (selected or fallback to primary)
    const { hotel, error, status } = await getSelectedHotel(selectedHotelId, 'id, user_role')

    if (error || !hotel) {
      return NextResponse.json({ error: error || 'Hotel not found' }, { status })
    }

    const hotelRecord = hotel as unknown as { id: string; user_role?: string }

    // Check if user is client (not agency)
    if (hotelRecord.user_role === 'agency') {
      return NextResponse.json({ error: 'Access denied. Client role required.' }, { status: 403 })
    }

    // Fetch marketing analysis
    const data = await getMarketingAnalysis(
      hotelRecord.id,
      startDate || undefined,
      endDate || undefined
    )

    return NextResponse.json(data)

  } catch (error) {
    console.error('Client marketing API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
