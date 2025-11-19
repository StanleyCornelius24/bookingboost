import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getClientDashboardData } from '@/lib/client-dashboard-data'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Check auth
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's hotel
    const { data: hotel } = await supabase
      .from('hotels')
      .select('id, user_role')
      .eq('user_id', session.user.id)
      .single()

    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })
    }

    // Optional: Check if user is client (though this could be used by both roles)
    // if (hotel.user_role !== 'client') {
    //   return NextResponse.json({ error: 'Client access required' }, { status: 403 })
    // }

    // Fetch client dashboard data
    const data = await getClientDashboardData(hotel.id)

    if (!data) {
      return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Client dashboard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}