import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET() {
  const supabase = await createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const cookieStore = await cookies()
  const impersonateUserId = cookieStore.get('impersonate_user_id')?.value
  const userId = impersonateUserId || session.user.id

  const { data: hotels, error } = await supabase
    .from('hotels')
    .select('*')
    .eq('user_id', userId)
    .order('is_primary', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    userId,
    email: session.user.email,
    hotels,
    primaryHotel: hotels?.[0],
    userRole: hotels?.[0]?.user_role,
    impersonating: !!impersonateUserId
  })
}
