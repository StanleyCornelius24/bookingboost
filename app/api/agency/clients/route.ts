import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAgencyClientMetrics } from '@/lib/agency-data'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Check auth
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is agency
    const { data: hotel } = await supabase
      .from('hotels')
      .select('user_role')
      .eq('user_id', session.user.id)
      .single()

    if (!hotel || hotel.user_role !== 'agency') {
      return NextResponse.json({ error: 'Access denied. Agency role required.' }, { status: 403 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Fetch client metrics
    const data = await getAgencyClientMetrics(
      startDate || undefined,
      endDate || undefined
    )

    return NextResponse.json(data)

  } catch (error) {
    console.error('Agency clients API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}