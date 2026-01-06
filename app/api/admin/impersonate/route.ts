import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const { userId } = await request.json()

    // Check if user is admin
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userHotel } = await supabase
      .from('hotels')
      .select('user_role')
      .eq('user_id', session.user.id)
      .single()

    if (!userHotel || userHotel.user_role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get the user to impersonate
    const { data: targetHotel } = await supabase
      .from('hotels')
      .select('user_id, user_role')
      .eq('user_id', userId)
      .single()

    if (!targetHotel) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Store impersonation in cookie
    const cookieStore = await cookies()
    cookieStore.set('impersonate_user_id', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
    })
    cookieStore.set('impersonate_role', targetHotel.user_role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
    })

    return NextResponse.json({ success: true, role: targetHotel.user_role })
  } catch (error) {
    console.error('Error impersonating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Exit impersonation
export async function DELETE() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('impersonate_user_id')
    cookieStore.delete('impersonate_role')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error exiting impersonation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
