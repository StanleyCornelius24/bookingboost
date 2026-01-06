import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createServerClient()

    // Check if user is admin
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user's hotel to check role
    const { data: userHotel } = await supabase
      .from('hotels')
      .select('user_role')
      .eq('user_id', session.user.id)
      .single()

    if (!userHotel || userHotel.user_role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch all users from auth.users via RPC or admin API
    // Since we can't directly query auth.users, we'll get all hotels with user info
    const { data: hotels, error } = await supabase
      .from('hotels')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Get unique users
    const usersMap = new Map()
    hotels?.forEach(hotel => {
      if (!usersMap.has(hotel.user_id)) {
        usersMap.set(hotel.user_id, {
          id: hotel.user_id,
          email: hotel.email,
          role: hotel.user_role,
          hotels: [hotel],
          created_at: hotel.created_at
        })
      } else {
        usersMap.get(hotel.user_id).hotels.push(hotel)
      }
    })

    const users = Array.from(usersMap.values())

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
