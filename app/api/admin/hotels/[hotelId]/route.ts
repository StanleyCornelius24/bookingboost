import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Update hotel
export async function PATCH(
  request: Request,
  context: { params: Promise<{ hotelId: string }> }
) {
  try {
    const supabase = await createServerClient()
    const { hotelId } = await context.params

    // Check if user is admin
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userHotel } = await supabase
      .from('hotels')
      .select('user_role')
      .eq('user_id', session.user.id)
      .single()

    if (!userHotel || userHotel.user_role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    // Update hotel
    const { error } = await supabase
      .from('hotels')
      .update(body)
      .eq('id', hotelId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating hotel:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Delete hotel
export async function DELETE(
  request: Request,
  context: { params: Promise<{ hotelId: string }> }
) {
  try {
    const supabase = await createServerClient()
    const { hotelId } = await context.params

    // Check if user is admin
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userHotel } = await supabase
      .from('hotels')
      .select('user_role')
      .eq('user_id', session.user.id)
      .single()

    if (!userHotel || userHotel.user_role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete hotel (cascade will handle related data)
    const { error } = await supabase
      .from('hotels')
      .delete()
      .eq('id', hotelId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting hotel:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
