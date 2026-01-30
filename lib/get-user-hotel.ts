import { createServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export interface Hotel {
  id: string
  name: string
  email: string
  website: string | null
  currency: string
  user_id: string
  user_role: string
  is_primary: boolean
  display_order: number
  created_at: string
  updated_at: string
  google_analytics_property_id?: string | null
  google_ads_customer_id?: string | null
  google_ads_manager_id?: string | null
  meta_ad_account_id?: string | null
  last_settings_sync?: string | null
}

/**
 * Get the user's primary hotel or first hotel if no primary is set
 * Supports impersonation
 */
export async function getPrimaryHotel(): Promise<Hotel | null> {
  try {
    const supabase = await createServerClient()

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return null
    }

    // Check for impersonation
    const cookieStore = await cookies()
    const impersonateUserId = cookieStore.get('impersonate_user_id')?.value
    const userId = impersonateUserId || session.user.id

    // Get user's hotels, ordered by primary then creation date
    const { data: hotels, error } = await supabase
      .from('hotels')
      .select('*')
      .eq('user_id', userId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true })

    if (error || !hotels || hotels.length === 0) {
      return null
    }

    return hotels[0]
  } catch (error) {
    console.error('Error getting primary hotel:', error)
    return null
  }
}
