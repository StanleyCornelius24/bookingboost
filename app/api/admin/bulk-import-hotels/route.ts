import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin or supaadmin
    const { data: hotel } = await supabase
      .from('hotels')
      .select('user_role')
      .eq('user_id', session.user.id)
      .single()

    if (!hotel || (hotel.user_role !== 'admin' && hotel.user_role !== 'supaadmin')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { hotels } = await request.json()

    if (!hotels || !Array.isArray(hotels)) {
      return NextResponse.json({ error: 'Invalid request: hotels array required' }, { status: 400 })
    }

    const adminSupabase = createAdminClient()
    const results = {
      success: [] as string[],
      errors: [] as string[]
    }

    for (const hotelData of hotels) {
      try {
        const { clientName, websiteAddress, ga4PropertyId, googleAdsCustomerId, googleAdsManagerId, bookingEngine, currency, email } = hotelData

        if (!clientName || !email) {
          results.errors.push(`Skipped: Missing required fields for ${clientName || email}`)
          continue
        }

        // Create user account
        const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
          email,
          password: 'FrankEli2019@',
          email_confirm: true
        })

        let userId: string

        if (authError) {
          // Check if user already exists
          if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
            // Get existing user ID
            const { data: existingUser } = await adminSupabase.auth.admin.listUsers()
            const user = existingUser?.users.find(u => u.email === email)

            if (!user) {
              results.errors.push(`${clientName}: User exists but couldn't retrieve user ID`)
              continue
            }
            userId = user.id
          } else {
            results.errors.push(`${clientName}: Failed to create account - ${authError.message}`)
            continue
          }
        } else if (!authData.user) {
          results.errors.push(`${clientName}: Failed to create user account`)
          continue
        } else {
          userId = authData.user.id
        }

        // Create hotel for the user
        const { error: hotelError } = await adminSupabase
          .from('hotels')
          .insert({
            user_id: userId,
            name: clientName,
            email: email,
            website: websiteAddress || null,
            currency: currency || 'ZAR',
            google_analytics_property_id: ga4PropertyId || null,
            google_ads_customer_id: googleAdsCustomerId || null,
            google_ads_manager_id: googleAdsManagerId || null,
            booking_engine: bookingEngine || null,
            is_primary: true,
            user_role: 'client'
          })

        if (hotelError) {
          results.errors.push(`${clientName}: Failed to create hotel - ${hotelError.message}`)
          continue
        }

        results.success.push(`${clientName} (${email})`)
      } catch (error) {
        results.errors.push(`${hotelData.clientName}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Bulk import error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
