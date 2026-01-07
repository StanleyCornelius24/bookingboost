import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role client to bypass RLS for API key validation
const supabaseServiceRole = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET(request: NextRequest) {
  try {
    // Get API key from header
    const apiKey = request.headers.get('X-API-Key') || request.headers.get('Authorization')?.replace('Bearer ', '')

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key required. Provide via X-API-Key header or Authorization: Bearer header' },
        { status: 401 }
      )
    }

    // Validate API key and get user
    const { data: apiKeyData, error: apiKeyError } = await supabaseServiceRole
      .from('api_keys')
      .select('user_id, is_active, expires_at, last_used_at')
      .eq('key', apiKey)
      .maybeSingle()

    if (apiKeyError || !apiKeyData) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    // Check if key is active
    if (!apiKeyData.is_active) {
      return NextResponse.json(
        { error: 'API key is inactive' },
        { status: 401 }
      )
    }

    // Check if key is expired
    if (apiKeyData.expires_at && new Date(apiKeyData.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'API key has expired' },
        { status: 401 }
      )
    }

    // Update last_used_at
    await supabaseServiceRole
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('key', apiKey)

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const hotelId = searchParams.get('hotel_id')
    const limit = parseInt(searchParams.get('limit') || '10')
    const allHotels = searchParams.get('all_hotels') === 'true'

    // Check if user is admin or supaadmin by looking at their hotel's user_role
    let isAdmin = false

    const { data: hotelWithRole } = await supabaseServiceRole
      .from('hotels')
      .select('user_role')
      .eq('user_id', apiKeyData.user_id)
      .maybeSingle()

    if (hotelWithRole) {
      isAdmin = hotelWithRole.user_role === 'admin' || hotelWithRole.user_role === 'supaadmin'
    }

    console.log('User role check:', { user_id: apiKeyData.user_id, user_role: hotelWithRole?.user_role, isAdmin })

    // Get hotels based on permissions
    let hotelsQuery = supabaseServiceRole
      .from('hotels')
      .select('id, name, website, user_id')

    // If not requesting all hotels, or not an admin, filter by user_id
    if (!allHotels || !isAdmin) {
      hotelsQuery = hotelsQuery.eq('user_id', apiKeyData.user_id)
    }

    const { data: hotels, error: hotelsError } = await hotelsQuery

    if (hotelsError) {
      console.error('Error fetching hotels:', hotelsError)
      return NextResponse.json(
        { error: 'Failed to fetch hotels' },
        { status: 500 }
      )
    }

    if (!hotels || hotels.length === 0) {
      return NextResponse.json({
        hotels: [],
        message: allHotels && isAdmin ? 'No hotels found in the system' : 'No hotels found for this user'
      })
    }

    // Get SEO audits
    let query = supabaseServiceRole
      .from('seo_audits')
      .select('*')
      .order('timestamp', { ascending: false })

    // Filter by hotel_id if provided
    if (hotelId) {
      // Verify hotel belongs to user
      const hotelBelongsToUser = hotels.some(h => h.id === hotelId)
      if (!hotelBelongsToUser) {
        return NextResponse.json(
          { error: 'Hotel not found or access denied' },
          { status: 403 }
        )
      }
      query = query.eq('hotel_id', hotelId)
    } else {
      // Get audits for all user's hotels
      const hotelIds = hotels.map(h => h.id)
      query = query.in('hotel_id', hotelIds)
    }

    query = query.limit(limit)

    const { data: audits, error: auditsError } = await query

    if (auditsError) {
      console.error('Error fetching audits:', auditsError)
      return NextResponse.json(
        { error: 'Failed to fetch SEO audits' },
        { status: 500 }
      )
    }

    // If fetching all hotels, get user information
    let usersMap = new Map()
    if (allHotels && isAdmin) {
      const uniqueUserIds = [...new Set(hotels.map(h => h.user_id))]
      const { data: users } = await supabaseServiceRole
        .from('users')
        .select('id, email, full_name')
        .in('id', uniqueUserIds)

      if (users) {
        users.forEach(user => {
          usersMap.set(user.id, user)
        })
      }
    }

    // Enrich audits with hotel information
    const enrichedAudits = audits?.map(audit => {
      const hotel = hotels.find(h => h.id === audit.hotel_id)
      const auditData: any = {
        id: audit.id,
        hotel_id: audit.hotel_id,
        hotel_name: hotel?.name || 'Unknown',
        hotel_website: hotel?.website || null,
        url: audit.url,
        timestamp: audit.timestamp,
        overall_score: audit.overall_score,
        checks: audit.checks,
        created_at: audit.created_at
      }

      // Include user info if fetching all hotels
      if (allHotels && isAdmin && hotel) {
        const user = usersMap.get(hotel.user_id)
        auditData.owner = {
          user_id: hotel.user_id,
          email: user?.email || 'Unknown',
          full_name: user?.full_name || null
        }
      }

      return auditData
    })

    const responseData: any = {
      success: true,
      count: enrichedAudits?.length || 0,
      audits: enrichedAudits || [],
      hotels: hotels.map(h => {
        const hotelData: any = {
          id: h.id,
          name: h.name,
          website: h.website
        }

        // Include owner info if fetching all hotels
        if (allHotels && isAdmin) {
          const user = usersMap.get(h.user_id)
          hotelData.owner = {
            user_id: h.user_id,
            email: user?.email || 'Unknown',
            full_name: user?.full_name || null
          }
        }

        return hotelData
      })
    }

    // Add metadata about the request
    if (allHotels && isAdmin) {
      responseData.scope = 'all_hotels'
    } else {
      responseData.scope = 'user_hotels'
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('External SEO Audits API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
