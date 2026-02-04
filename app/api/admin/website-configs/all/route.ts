import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserRole } from '@/lib/get-user-role'

/**
 * GET /api/admin/website-configs/all
 * Fetch ALL website configurations across all hotels (admin only)
 */
export async function GET() {
  const supabase = await createServerClient()
  const adminSupabase = createAdminClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Check if user is admin
    const role = await getUserRole()
    if (role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Fetch ALL website configs with hotel information (using admin client to bypass RLS)
    const { data: configs, error } = await adminSupabase
      .from('website_configs')
      .select(`
        *,
        hotels (
          id,
          name,
          website
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching website configs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch website configs' },
        { status: 500 }
      )
    }

    // Mask API keys and secrets for security (show first 10 chars only)
    const maskedConfigs = configs.map((config: any) => ({
      ...config,
      hotel_name: config.hotels?.name || 'Unknown Hotel',
      hotel_website: config.hotels?.website,
      api_key_preview: config.api_key.substring(0, 10) + '...',
      webhook_secret_preview: config.webhook_secret
        ? config.webhook_secret.substring(0, 8) + '...'
        : null,
      // Don't send full keys to client
      api_key: undefined,
      webhook_secret: undefined,
    }))

    console.log(`[API] Returning ${maskedConfigs.length} website configs`)
    console.log(`[API] First config:`, maskedConfigs[0]?.website_name, maskedConfigs[0]?.hotel_name)

    return NextResponse.json({
      configs: maskedConfigs,
      total: maskedConfigs.length,
    })
  } catch (error: any) {
    console.error('Website configs fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
