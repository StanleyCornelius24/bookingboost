import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/leads/[id] - Get single lead
 * PATCH /api/admin/leads/[id] - Update lead
 * DELETE /api/admin/leads/[id] - Delete lead
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: lead, error } = await supabase
      .from('leads')
      .select('*, website_configs(website_name, website_url), hotels(name)')
      .eq('id', params.id)
      .single()

    if (error || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    return NextResponse.json({ lead })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id } = params

    // Get current lead to check ownership
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id, hotel_id, status')
      .eq('id', id)
      .single()

    if (!existingLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Allowed fields to update
    const allowedFields = [
      'name',
      'email',
      'phone',
      'message',
      'status',
      'arrival_date',
      'departure_date',
      'adults',
      'children',
      'interested_in',
      'nationality',
      'lead_value',
    ]

    // Filter body to only include allowed fields
    const updates: any = {}
    Object.keys(body).forEach((key) => {
      if (allowedFields.includes(key)) {
        updates[key] = body[key]
      }
    })

    // Update the lead
    const { data: updatedLead, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating lead:', error)
      return NextResponse.json(
        { error: 'Failed to update lead' },
        { status: 500 }
      )
    }

    // Record status change if status was updated
    if (updates.status && updates.status !== existingLead.status) {
      await supabase.from('lead_status_changes').insert({
        lead_id: id,
        field_changed: 'status',
        old_value: existingLead.status,
        new_value: updates.status,
        changed_by: user.id,
        change_reason: 'Updated via lead detail modal',
      })
    }

    return NextResponse.json({
      success: true,
      lead: updatedLead,
    })
  } catch (error: any) {
    console.error('Update error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = params

    // Check if lead exists
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id, hotel_id')
      .eq('id', id)
      .single()

    if (!existingLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Delete the lead
    const { error } = await supabase.from('leads').delete().eq('id', id)

    if (error) {
      console.error('Error deleting lead:', error)
      return NextResponse.json(
        { error: 'Failed to delete lead' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Lead deleted successfully',
    })
  } catch (error: any) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
