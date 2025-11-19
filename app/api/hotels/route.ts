import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { name, email } = body

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Hotel name and email are required' },
        { status: 400 }
      )
    }

    // Check if user already has a hotel
    const { data: existingHotel } = await supabase
      .from('hotels')
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    if (existingHotel) {
      return NextResponse.json(
        { error: 'You already have a hotel profile' },
        { status: 400 }
      )
    }

    // Create hotel
    const { data: hotel, error } = await supabase
      .from('hotels')
      .insert({
        name: name.trim(),
        email: email.trim(),
        user_id: session.user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Hotel creation error:', error)
      return NextResponse.json(
        { error: 'Failed to create hotel profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Hotel profile created successfully',
      hotel
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}