import { createServerClient } from '@/lib/supabase/server'
import type { Hotel } from '@/types'

export async function getUserRole(): Promise<'agency' | 'client' | null> {
  try {
    const supabase = await createServerClient()

    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return null
    }

    // Get hotel info for current user
    const { data: hotel, error } = await supabase
      .from('hotels')
      .select('user_role')
      .eq('user_id', session.user.id)
      .single()

    if (error) {
      console.error('Error fetching user role:', error)
      return null
    }

    return hotel?.user_role || 'client'
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

    // Get complete hotel info for current user
    const { data: hotel, error } = await supabase
      .from('hotels')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    if (error) {
      console.error('Error fetching user hotel:', error)
      return null
    }

    return hotel
  } catch (error) {
    console.error('Error in getUserHotel:', error)
    return null
  }
}

export async function requireUserRole(): Promise<{ role: 'agency' | 'client'; hotel: Hotel }> {
  const hotel = await getUserHotel()

  if (!hotel) {
    throw new Error('Hotel not found')
  }

  return {
    role: hotel.user_role || 'client',
    hotel
  }
}