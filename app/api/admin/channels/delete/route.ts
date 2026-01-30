import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// Delete all bookings from a specific channel globally
export async function DELETE(request: NextRequest) {
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
    const { searchParams } = new URL(request.url)
    const channelName = searchParams.get('channelName')

    if (!channelName) {
      return NextResponse.json({ error: 'channelName is required' }, { status: 400 })
    }

    // Get count of bookings to be deleted
    const { count } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('channel', channelName)

    if (count === 0) {
      return NextResponse.json(
        { error: `No bookings found with channel name "${channelName}"` },
        { status: 404 }
      )
    }

    // Delete all bookings with this channel name
    const { error: deleteError } = await supabase
      .from('bookings')
      .delete()
      .eq('channel', channelName)

    if (deleteError) {
      console.error('Error deleting channel bookings:', deleteError)
      return NextResponse.json({ error: 'Failed to delete channel bookings' }, { status: 500 })
    }

    // Also clean up commission_rates for this channel
    const { error: commissionError } = await supabase
      .from('commission_rates')
      .delete()
      .eq('channel_name', channelName)

    if (commissionError) {
      console.warn('Error deleting commission rates (non-critical):', commissionError)
    }

    // Clean up hidden_channels for this channel
    const { error: hiddenError } = await supabase
      .from('hidden_channels')
      .delete()
      .eq('channel_name', channelName)

    if (hiddenError) {
      console.warn('Error deleting hidden channels (non-critical):', hiddenError)
    }

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${count} bookings from channel "${channelName}"`,
      deletedCount: count
    })
  } catch (error) {
    console.error('Error in channel delete:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete channel' },
      { status: 500 }
    )
  }
}
