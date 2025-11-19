import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { email, password, hotelName } = await request.json()

    // Validate input
    if (!email || !password || !hotelName) {
      return NextResponse.json(
        { error: 'Email, password, and hotel name are required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Create the user account
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for easier onboarding
    })

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Create hotel record using service role (bypasses RLS)
    const { error: hotelError } = await supabase
      .from('hotels')
      .insert({
        name: hotelName,
        email: email,
        user_id: authData.user.id,
      })

    if (hotelError) {
      console.error('Hotel creation error:', hotelError)

      // If hotel creation fails, try to clean up the user account
      await supabase.auth.admin.deleteUser(authData.user.id)

      return NextResponse.json(
        { error: 'Failed to create hotel record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully. You can now log in.',
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
