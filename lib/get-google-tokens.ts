import { createServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

/**
 * Get Google API tokens for the current user/hotel with fallback to admin tokens
 * This allows admins to connect Google once and use it for all hotels they manage
 */
export async function getGoogleApiTokens(hotelId: string, session: any) {
  const supabase = await createServerClient()

  // First, try to get tokens for the current hotel
  const { data: hotelToken } = await supabase
    .from('api_tokens')
    .select('*')
    .eq('hotel_id', hotelId)
    .eq('service', 'google')
    .maybeSingle()

  if (hotelToken) {
    return hotelToken
  }

  // If no hotel token found, check if we're impersonating
  const cookieStore = await cookies()
  const impersonateUserId = cookieStore.get('impersonate_user_id')?.value

  // If impersonating, try to get the admin's tokens as fallback
  if (impersonateUserId) {
    // Get the admin's hotel
    const { data: adminHotel } = await supabase
      .from('hotels')
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    if (adminHotel) {
      // Get admin's Google tokens
      const { data: adminToken } = await supabase
        .from('api_tokens')
        .select('*')
        .eq('hotel_id', adminHotel.id)
        .eq('service', 'google')
        .maybeSingle()

      if (adminToken) {
        return adminToken
      }
    }
  }

  // No tokens found
  return null
}
