import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/get-user-role'

// GET all hotels (admin only)
export async function GET() {
  try {
    const supabase = await createServerClient()

    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const role = await getUserRole()
    if (role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Fetch all hotels in the system, ordered by name
    const { data: hotels, error } = await supabase
      .from('hotels')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching hotels:', error)
      return NextResponse.json(
        { error: 'Failed to fetch hotels' },
        { status: 500 }
      )
    }

    return NextResponse.json({ hotels })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
