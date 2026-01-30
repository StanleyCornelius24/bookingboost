import { NextRequest, NextResponse } from 'next/server'
import { getClientDashboardData } from '@/lib/client-dashboard-data'
import { getSelectedHotel } from '@/lib/get-selected-hotel'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    // Get selected hotel ID from query parameter
    const { searchParams } = new URL(request.url)
    const selectedHotelId = searchParams.get('hotelId')

    // Get the hotel (selected or fallback to primary)
    const { hotel, error, status } = await getSelectedHotel(selectedHotelId, 'id, user_role')

    if (error || !hotel) {
      return NextResponse.json({ error: error || 'Hotel not found' }, { status })
    }

    const hotelRecord = hotel as unknown as { id: string; user_role?: string }

    // Optional: Check if user is client (though this could be used by both roles)
    // if (hotelRecord.user_role !== 'client') {
    //   return NextResponse.json({ error: 'Client access required' }, { status: 403 })
    // }

    // Fetch client dashboard data
    const data = await getClientDashboardData(hotelRecord.id)

    if (!data) {
      return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
    }

    // Include user_role in the response
    return NextResponse.json({ ...data, userRole: hotelRecord.user_role }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('Client dashboard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}