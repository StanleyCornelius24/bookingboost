import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getClientChannelsAnalysis } from '@/lib/client-channels-data'

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
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })
    }

    // Get date range from query parameters
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Fetch client channels analysis
    const data = await getClientChannelsAnalysis(hotel.id, startDate, endDate)

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