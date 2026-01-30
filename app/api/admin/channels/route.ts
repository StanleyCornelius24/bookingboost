import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// Get all unique channels across all hotels
export async function GET(request: NextRequest) {
  const supabase = await createServerClient()

  // Check auth
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check for admin role
  const cookieStore = await cookies()
  const impersonateUserId = cookieStore.get('impersonate_user_id')?.value
  const userId = impersonateUserId || session.user.id

  const { data: hotels } = await supabase
    .from('hotels')
    .select('user_role')
    .eq('user_id', userId)
    .order('is_primary', { ascending: false })
    .limit(1)

  const userRole = hotels?.[0]?.user_role

  if (userRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
  }

  try {
    // Get all bookings with pagination to avoid hitting limits
    let allBookings: { channel: string | null }[] = []
    let page = 0
    const pageSize = 1000
    let hasMore = true

    while (hasMore) {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('channel')
        .range(page * pageSize, (page + 1) * pageSize - 1)

      if (error) {
        console.error('Error fetching bookings:', error)
        return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 })
      }

      if (bookings && bookings.length > 0) {
        allBookings = allBookings.concat(bookings)
        hasMore = bookings.length === pageSize
        page++
      } else {
        hasMore = false
      }
    }

    // Count bookings per channel
    const channelCounts = new Map<string, number>()
    allBookings.forEach(booking => {
      if (booking.channel) {
        channelCounts.set(booking.channel, (channelCounts.get(booking.channel) || 0) + 1)
      }
    })

    // Convert to array and sort by count
    const channels = Array.from(channelCounts.entries())
      .map(([channel, bookingCount]) => ({ channel, bookingCount }))
      .sort((a, b) => b.bookingCount - a.bookingCount)

    return NextResponse.json({ channels })
  } catch (error) {
    console.error('Error in admin channels GET:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch channels' },
      { status: 500 }
    )
  }
}
