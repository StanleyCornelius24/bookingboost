import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getSelectedHotel } from '@/lib/get-selected-hotel'

/**
 * Admin Leads API
 *
 * GET - Fetch leads with filtering and pagination
 * POST - Bulk actions on leads
 */

/**
 * GET /api/admin/leads
 * Query params:
 * - hotelId: Hotel ID
 * - status: Filter by status (new, contacted, qualified, converted, spam, rejected)
 * - quality: Filter by quality_category (high, medium, low)
 * - is_spam: Filter by spam status (true/false)
 * - days: Number of days to look back (default: 30)
 * - limit: Number of results (default: 50, max: 1000)
 * - offset: Pagination offset (default: 0)
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
    const statusFilter = searchParams.get('status')
    const qualityFilter = searchParams.get('quality')
    const isSpamFilter = searchParams.get('is_spam')
    const days = parseInt(searchParams.get('days') || '30')
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '50'),
      1000
    )
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get the hotel
    const { hotel, error: hotelError, status } = await getSelectedHotel(
      selectedHotelId,
      'id, name'
    )

    if (hotelError || !hotel) {
      return NextResponse.json(
        { error: hotelError || 'Hotel not found' },
        { status }
      )
    }

    const hotelRecord = hotel as unknown as { id: string; name: string }

    // Calculate date range
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Build query
    let query = supabase
      .from('leads')
      .select('*, website_configs(website_name, website_url)', {
        count: 'exact',
      })
      .eq('hotel_id', hotelRecord.id)
      .gte('submitted_at', startDate.toISOString())
      .order('submitted_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (statusFilter) {
      query = query.eq('status', statusFilter)
    }
    if (qualityFilter) {
      query = query.eq('quality_category', qualityFilter)
    }
    if (isSpamFilter !== null) {
      query = query.eq('is_spam', isSpamFilter === 'true')
    }

    const { data: leads, error, count } = await query

    if (error) {
      console.error('Error fetching leads:', error)
      return NextResponse.json(
        { error: 'Failed to fetch leads' },
        { status: 500 }
      )
    }

    // Get summary statistics
    const { data: stats } = await supabase
      .from('leads')
      .select('quality_category, is_spam, status')
      .eq('hotel_id', hotelRecord.id)
      .gte('submitted_at', startDate.toISOString())

    const summary = {
      total: stats?.length || 0,
      high_quality: stats?.filter((l) => l.quality_category === 'high').length || 0,
      medium_quality: stats?.filter((l) => l.quality_category === 'medium').length || 0,
      low_quality: stats?.filter((l) => l.quality_category === 'low').length || 0,
      spam: stats?.filter((l) => l.is_spam).length || 0,
      new: stats?.filter((l) => l.status === 'new').length || 0,
      contacted: stats?.filter((l) => l.status === 'contacted').length || 0,
      converted: stats?.filter((l) => l.status === 'converted').length || 0,
    }

    return NextResponse.json({
      leads: leads || [],
      total: count || 0,
      summary,
      pagination: {
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    })
  } catch (error: any) {
    console.error('Leads fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/admin/leads
 * Bulk actions on leads
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { action, lead_ids } = body

    if (!action || !lead_ids || !Array.isArray(lead_ids)) {
      return NextResponse.json(
        { error: 'Missing action or lead_ids' },
        { status: 400 }
      )
    }

    // Verify user has access to these leads
    const { data: leads } = await supabase
      .from('leads')
      .select('id, hotel_id, status')
      .in('id', lead_ids)

    if (!leads || leads.length === 0) {
      return NextResponse.json(
        { error: 'No leads found' },
        { status: 404 }
      )
    }

    // Execute action
    let updateData: any = {}

    switch (action) {
      case 'mark_contacted':
        updateData = { status: 'contacted' }
        break
      case 'mark_qualified':
        updateData = { status: 'qualified' }
        break
      case 'mark_spam':
        updateData = { status: 'spam', is_spam: true }
        break
      case 'mark_rejected':
        updateData = { status: 'rejected' }
        break
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    const { error } = await supabase
      .from('leads')
      .update(updateData)
      .in('id', lead_ids)

    if (error) {
      console.error('Error updating leads:', error)
      return NextResponse.json(
        { error: 'Failed to update leads' },
        { status: 500 }
      )
    }

    // Record status changes
    const statusChanges = leads.map((lead) => ({
      lead_id: lead.id,
      field_changed: 'status',
      old_value: lead.status,
      new_value: updateData.status,
      changed_by: user.id,
      change_reason: `Bulk action: ${action}`,
    }))

    await supabase.from('lead_status_changes').insert(statusChanges)

    return NextResponse.json({
      success: true,
      updated: leads.length,
      message: `Updated ${leads.length} leads`,
    })
  } catch (error: any) {
    console.error('Bulk action error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
