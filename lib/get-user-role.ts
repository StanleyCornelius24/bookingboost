import { createServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import type { Hotel } from '@/types'

export async function getUserRole(): Promise<'agency' | 'client' | 'admin' | null> {
  try {
    const supabase = await createServerClient()

    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return null
    }

    // Check for impersonation
    const cookieStore = await cookies()
    const impersonateUserId = cookieStore.get('impersonate_user_id')?.value
    const impersonateRole = cookieStore.get('impersonate_role')?.value

    if (impersonateUserId && impersonateRole) {
      return impersonateRole as 'agency' | 'client' | 'admin'
    }

    // Get hotel info for current user (get primary hotel or first hotel)
    const { data: hotels, error } = await supabase
      .from('hotels')
      .select('user_role, is_primary')
      .eq('user_id', session.user.id)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching user role:', error)
      return null
    }

    if (!hotels || hotels.length === 0) {
      return null
    }

    return hotels[0]?.user_role || 'client'
  } catch (error) {
    console.error('Error in getUserRole:', error)
    return null
  }
}

export async function getUserHotel(): Promise<Hotel | null> {
  try {
    const supabase = await createServerClient()

    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return null
    }

    // Check for impersonation
    const cookieStore = await cookies()
    const impersonateUserId = cookieStore.get('impersonate_user_id')?.value

    // Get complete hotel info for current user or impersonated user
    // Get primary hotel or first hotel if multiple hotels exist
    const userId = impersonateUserId || session.user.id
    const { data: hotels, error } = await supabase
      .from('hotels')
      .select('*')
      .eq('user_id', userId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching user hotel:', error)
      return null
    }

    if (!hotels || hotels.length === 0) {
      return null
    }

    return hotels[0]
  } catch (error) {
    console.error('Error in getUserHotel:', error)
    return null
  }
}

export async function requireUserRole(): Promise<{ role: 'agency' | 'client' | 'admin'; hotel: Hotel }> {
  const hotel = await getUserHotel()

  if (!hotel) {
    throw new Error('Hotel not found')
  }

  return {
    role: hotel.user_role || 'client',
    hotel
  }
}

export async function isImpersonating(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const impersonateUserId = cookieStore.get('impersonate_user_id')?.value
    return !!impersonateUserId
  } catch (error) {
    return false
  }
}

export async function getImpersonatedUserInfo(): Promise<{ userId: string; role: string } | null> {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('impersonate_user_id')?.value
    const role = cookieStore.get('impersonate_role')?.value

    if (userId && role) {
      return { userId, role }
    }
    return null
  } catch (error) {
    return null
  }
}