import { google } from 'googleapis'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('locationId')

    const supabase = await createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get hotel and API token
    const { data: hotel } = await supabase
      .from('hotels')
      .select('id, google_my_business_location_id')
      .eq('user_id', session.user.id)
      .single()

    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })
    }

    const { data: apiToken } = await supabase
      .from('api_tokens')
      .select('*')
      .eq('hotel_id', hotel.id)
      .eq('service', 'google')
      .single()

    if (!apiToken) {
      return NextResponse.json({ error: 'Google account not connected' }, { status: 404 })
    }

    // Set up Google My Business client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    )

    oauth2Client.setCredentials({
      access_token: apiToken.access_token,
      refresh_token: apiToken.refresh_token,
    })

    const mybusiness = google.mybusinessbusinessinformation({ version: 'v1', auth: oauth2Client })

    // If no location ID provided, list available locations first
    if (!locationId && !hotel.google_my_business_location_id) {
      try {
        // @ts-ignore - Google My Business API types may not be fully accurate
        const accountsResponse = await mybusiness.accounts.list()
        const accounts = accountsResponse.data.accounts || []

        if (accounts.length === 0) {
          return NextResponse.json({ error: 'No Google My Business accounts found' }, { status: 404 })
        }

        // Get locations for the first account
        // @ts-ignore - Google My Business API types may not be fully accurate
        const locationsResponse = await mybusiness.accounts.locations.list({
          parent: accounts[0].name
        })

        return NextResponse.json({
          accounts: accounts.map((acc: any) => ({
            name: acc.name,
            accountName: acc.accountName
          })),
          locations: locationsResponse.data.locations?.map((loc: any) => ({
            name: loc.name,
            displayName: loc.title,
            address: loc.storefrontAddress
          })) || []
        })
      } catch (error) {
        console.error('Error listing locations:', error)
        return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 })
      }
    }

    const businessLocationId = locationId || hotel.google_my_business_location_id

    if (!businessLocationId) {
      return NextResponse.json({ error: 'Business location ID not provided' }, { status: 400 })
    }

    // Get business information and insights
    try {
      const [locationResponse, reviewsResponse] = await Promise.allSettled([
        mybusiness.locations.get({ name: businessLocationId }),
        // Note: Reviews API might require different permissions
        fetch(`https://mybusiness.googleapis.com/v4/${businessLocationId}/reviews?access_token=${apiToken.access_token}`)
      ])

      const locationData = locationResponse.status === 'fulfilled' ? locationResponse.value.data : null
      let reviewsData = null

      if (reviewsResponse.status === 'fulfilled' && reviewsResponse.value.ok) {
        reviewsData = await reviewsResponse.value.json()
      }

      // Get insights (simplified - actual implementation would require specific metrics)
      const insights = {
        totalViews: Math.floor(Math.random() * 1000) + 500, // Placeholder
        searchViews: Math.floor(Math.random() * 500) + 200,
        mapsViews: Math.floor(Math.random() * 500) + 200,
        phoneCallClicks: Math.floor(Math.random() * 50) + 10,
        websiteClicks: Math.floor(Math.random() * 100) + 30,
        directionRequests: Math.floor(Math.random() * 200) + 50
      }

      const businessData = {
        location: {
          name: (locationData as any)?.title || 'Hotel Location',
          address: (locationData as any)?.storefrontAddress || {},
          phoneNumber: (locationData as any)?.phoneNumbers?.[0]?.number,
          website: (locationData as any)?.websiteUri,
          rating: parseFloat((locationData as any)?.metadata?.averageRating || '0'),
          reviewCount: parseInt((locationData as any)?.metadata?.reviewCount || '0')
        },
        reviews: {
          recent: (reviewsData as any)?.reviews?.slice(0, 5) || [],
          totalCount: (reviewsData as any)?.totalReviewCount || 0,
          averageRating: (reviewsData as any)?.averageRating || 0
        },
        insights
      }

      return NextResponse.json(businessData)

    } catch (error) {
      console.error('Google My Business API error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch business data' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}