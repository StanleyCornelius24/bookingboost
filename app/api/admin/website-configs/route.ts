import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateApiKey, generateWebhookSecret } from '@/lib/lead-utils'
import { getSelectedHotel } from '@/lib/get-selected-hotel'
import type { WebsiteConfig } from '@/types'

/**
 * Website Configurations API - Admin Only
 *
 * GET - List all website configs for a hotel
 * POST - Create new website config
 * PUT - Update existing config
 * DELETE - Deactivate config
 */

/**
 * GET /api/admin/website-configs?hotelId=xxx
 * Fetch all website configurations for a hotel
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const selectedHotelId = searchParams.get('hotelId')

    // Get the hotel (selected or fallback to primary)
    const { hotel, error: hotelError, status } = await getSelectedHotel(
      selectedHotelId,
      'id, name, user_role'
    )

    if (hotelError || !hotel) {
      return NextResponse.json(
        { error: hotelError || 'Hotel not found' },
        { status }
      )
    }

    const hotelRecord = hotel as unknown as {
      id: string
      name: string
      user_role: string
    }

    // Fetch website configs
    const { data: configs, error } = await supabase
      .from('website_configs')
      .select('*')
      .eq('hotel_id', hotelRecord.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching website configs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch website configs' },
        { status: 500 }
      )
    }

    // Mask API keys and secrets for security (show first 10 chars only)
    const maskedConfigs = configs.map((config) => ({
      ...config,
      api_key_preview: config.api_key.substring(0, 10) + '...',
      webhook_secret_preview: config.webhook_secret
        ? config.webhook_secret.substring(0, 8) + '...'
        : null,
      // Don't send full keys to client
      api_key: undefined,
      webhook_secret: undefined,
    }))

    return NextResponse.json({
      configs: maskedConfigs,
      hotel: {
        id: hotelRecord.id,
        name: hotelRecord.name,
      },
    })
  } catch (error: any) {
    console.error('Website configs fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/admin/website-configs
 * Create a new website configuration
 */
export async function POST(request: NextRequest) {
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
    const body = await request.json()
    const {
      hotelId,
      website_name,
      website_url,
      form_ids,
      daily_report_enabled,
      daily_report_time,
      daily_report_email,
      generate_secret,
    } = body

    // Validation
    if (!hotelId || !website_name || !website_url) {
      return NextResponse.json(
        { error: 'Missing required fields: hotelId, website_name, website_url' },
        { status: 400 }
      )
    }

    // Verify the hotel exists (admin users can create integrations for any hotel)
    const { data: hotel, error: hotelError } = await adminSupabase
      .from('hotels')
      .select('id, name')
      .eq('id', hotelId)
      .single()

    if (hotelError || !hotel) {
      return NextResponse.json(
        { error: 'Hotel not found' },
        { status: 404 }
      )
    }

    // Generate API key and optional webhook secret
    const apiKey = generateApiKey()
    const webhookSecret = generate_secret ? generateWebhookSecret() : null

    // Create website config
    const configData: Partial<WebsiteConfig> = {
      hotel_id: hotelId,
      website_name,
      website_url,
      form_ids: form_ids || [],
      api_key: apiKey,
      webhook_secret: webhookSecret,
      status: 'active',
      daily_report_enabled: daily_report_enabled ?? true,
      daily_report_time: daily_report_time || '08:00',
      daily_report_email: Array.isArray(daily_report_email)
        ? daily_report_email
        : [daily_report_email].filter(Boolean),
    }

    const { data: newConfig, error } = await adminSupabase
      .from('website_configs')
      .insert([configData])
      .select()
      .single()

    if (error) {
      console.error('Error creating website config:', error)
      return NextResponse.json(
        { error: 'Failed to create website config' },
        { status: 500 }
      )
    }

    // Return with full API key and secret (ONE TIME ONLY)
    return NextResponse.json(
      {
        success: true,
        config: newConfig,
        webhook_url: 'https://bookingboost.vercel.app/api/integrations/gravity-forms/webhook',
        setup_instructions: {
          step1: 'Copy the API key and webhook secret below (they will only be shown once)',
          step2: 'In your Gravity Forms settings, add a webhook feed',
          step3: 'Set the webhook URL to: https://bookingboost.vercel.app/api/integrations/gravity-forms/webhook',
          step4: 'Add a custom header: X-API-Key with the value below',
          step5: webhookSecret
            ? 'Add a custom header: X-Webhook-Signature with HMAC-SHA256 signature'
            : 'Webhook signature verification is disabled (optional)',
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Website config creation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * PUT /api/admin/website-configs
 * Update an existing website configuration
 */
export async function PUT(request: NextRequest) {
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
    const body = await request.json()
    const {
      configId,
      website_name,
      website_url,
      form_ids,
      status,
      daily_report_enabled,
      daily_report_time,
      daily_report_email,
    } = body

    if (!configId) {
      return NextResponse.json(
        { error: 'Missing configId' },
        { status: 400 }
      )
    }

    // Verify config exists (use admin client for admin access)
    const { data: existingConfig } = await adminSupabase
      .from('website_configs')
      .select('*')
      .eq('id', configId)
      .single()

    if (!existingConfig) {
      return NextResponse.json(
        { error: 'Config not found' },
        { status: 404 }
      )
    }

    // Build update object
    const updateData: Partial<WebsiteConfig> = {}
    if (website_name !== undefined) updateData.website_name = website_name
    if (website_url !== undefined) updateData.website_url = website_url
    if (form_ids !== undefined) updateData.form_ids = form_ids
    if (status !== undefined) updateData.status = status
    if (daily_report_enabled !== undefined)
      updateData.daily_report_enabled = daily_report_enabled
    if (daily_report_time !== undefined)
      updateData.daily_report_time = daily_report_time
    if (daily_report_email !== undefined)
      updateData.daily_report_email = Array.isArray(daily_report_email)
        ? daily_report_email
        : [daily_report_email].filter(Boolean)

    const { data: updatedConfig, error } = await adminSupabase
      .from('website_configs')
      .update(updateData)
      .eq('id', configId)
      .select()
      .single()

    if (error) {
      console.error('Error updating website config:', error)
      return NextResponse.json(
        { error: 'Failed to update website config' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      config: updatedConfig,
    })
  } catch (error: any) {
    console.error('Website config update error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/website-configs?configId=xxx&permanent=true
 * Deactivate or permanently delete a website configuration
 */
export async function DELETE(request: NextRequest) {
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
    const { searchParams } = new URL(request.url)
    const configId = searchParams.get('configId')
    const permanent = searchParams.get('permanent') === 'true'

    if (!configId) {
      return NextResponse.json(
        { error: 'Missing configId' },
        { status: 400 }
      )
    }

    // Verify config exists (use admin client for admin access)
    const { data: existingConfig } = await adminSupabase
      .from('website_configs')
      .select('*')
      .eq('id', configId)
      .single()

    if (!existingConfig) {
      return NextResponse.json(
        { error: 'Config not found' },
        { status: 404 }
      )
    }

    if (permanent) {
      // Permanently delete the config
      const { error } = await adminSupabase
        .from('website_configs')
        .delete()
        .eq('id', configId)

      if (error) {
        console.error('Error deleting website config:', error)
        return NextResponse.json(
          { error: 'Failed to delete website config' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Website config deleted permanently',
      })
    } else {
      // Deactivate (don't actually delete to preserve data integrity)
      const { error } = await adminSupabase
        .from('website_configs')
        .update({ status: 'inactive' })
        .eq('id', configId)

      if (error) {
        console.error('Error deactivating website config:', error)
        return NextResponse.json(
          { error: 'Failed to deactivate website config' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Website config deactivated',
      })
    }
  } catch (error: any) {
    console.error('Website config deletion error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
