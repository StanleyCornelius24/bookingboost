import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getMarketingAnalysis } from '@/lib/marketing-analysis-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Check auth
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the user's hotel
    const { data: hotel } = await supabase
      .from('hotels')
      .select('id, user_role')
      .eq('user_id', session.user.id)
      .single()

    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })
    }

    // Check if user is client (not agency)
    if (hotel.user_role === 'agency') {
      return NextResponse.json({ error: 'Access denied. Client role required.' }, { status: 403 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Fetch marketing analysis
    const data = await getMarketingAnalysis(
      hotel.id,
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
