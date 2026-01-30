import { createServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

/**
 * Get the hotel for the current request
 * Checks for a selectedHotelId query parameter first, then falls back to primary/first hotel
 * Also verifies the user has access to the selected hotel
 */
export async function getSelectedHotel(selectedHotelId: string | null, fields: string = '*') {
  const supabase = await createServerClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return { hotel: null, error: 'Unauthorized', status: 401 }
  }

  // Check for impersonation
  const cookieStore = await cookies()
  const impersonateUserId = cookieStore.get('impersonate_user_id')?.value
  const userId = impersonateUserId || session.user.id

  // If a specific hotel is selected, verify access and return it
  if (selectedHotelId) {
    const { data: selectedHotel, error } = await supabase
      .from('hotels')
      .select(fields)
      .eq('id', selectedHotelId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('Error fetching selected hotel:', error)
      return { hotel: null, error: 'Failed to fetch hotel', status: 500 }
    }

    if (!selectedHotel) {
      return { hotel: null, error: 'Hotel not found or access denied', status: 404 }
    }

    return { hotel: selectedHotel, error: null, status: 200 }
  }

  // Fallback: Get primary or first hotel
  const { data: hotels, error } = await supabase
    .from('hotels')
    .select(fields)
    .eq('user_id', userId)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching hotels:', error)
    return { hotel: null, error: 'Failed to fetch hotels', status: 500 }
  }

  if (!hotels || hotels.length === 0) {
    return { hotel: null, error: 'Hotel not found', status: 404 }
  }

  return { hotel: hotels[0], error: null, status: 200 }
}
