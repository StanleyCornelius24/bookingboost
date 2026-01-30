import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// Merge/rename channels globally
export async function POST(request: NextRequest) {
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
    const body = await request.json()
    const { oldChannelName, newChannelName } = body

    if (!oldChannelName || !newChannelName) {
      return NextResponse.json(
        { error: 'Both oldChannelName and newChannelName are required' },
        { status: 400 }
      )
    }

    if (oldChannelName === newChannelName) {
      return NextResponse.json(
        { error: 'Old and new channel names must be different' },
        { status: 400 }
      )
    }

    // Get count of bookings to be updated
    const { count } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('channel', oldChannelName)

    if (count === 0) {
      return NextResponse.json(
        { error: `No bookings found with channel name "${oldChannelName}"` },
        { status: 404 }
      )
    }

    // Update all bookings with the old channel name to the new channel name
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ channel: newChannelName })
      .eq('channel', oldChannelName)

    if (updateError) {
      console.error('Error updating channels:', updateError)
      return NextResponse.json({ error: 'Failed to merge channels' }, { status: 500 })
    }

    // Also update commission_rates table if there are custom rates
    const { error: commissionError } = await supabase
      .from('commission_rates')
      .update({ channel_name: newChannelName })
      .eq('channel_name', oldChannelName)

    if (commissionError) {
      console.warn('Error updating commission rates (non-critical):', commissionError)
    }

    // Update hidden_channels table
    const { error: hiddenError } = await supabase
      .from('hidden_channels')
      .update({ channel_name: newChannelName })
      .eq('channel_name', oldChannelName)

    if (hiddenError) {
      console.warn('Error updating hidden channels (non-critical):', hiddenError)
    }

    return NextResponse.json({
      success: true,
      message: `Successfully merged "${oldChannelName}" into "${newChannelName}"`,
      updatedCount: count
    })
  } catch (error) {
    console.error('Error in channel merge:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to merge channels' },
      { status: 500 }
    )
  }
}
