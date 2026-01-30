import { google } from 'googleapis'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getSelectedHotel } from '@/lib/get-selected-hotel'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const selectedHotelId = searchParams.get('hotelId')

    const supabase = await createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the hotel (selected or fallback to primary)
    const { hotel, error: hotelError, status } = await getSelectedHotel(
      selectedHotelId,
      'id, google_my_business_location_id'
    )

    if (hotelError || !hotel) {
      return NextResponse.json({ error: hotelError || 'Hotel not found' }, { status })
    }

    const hotelRecord = hotel as unknown as { id: string; google_my_business_location_id: string | null }

    if (!hotelRecord.google_my_business_location_id) {
      return NextResponse.json({
        error: 'Google Business Profile location ID not configured. Please add it in Settings.'
      }, { status: 400 })
    }

    const { data: apiToken, error: tokenError } = await supabase
      .from('api_tokens')
      .select('*')
      .eq('hotel_id', hotelRecord.id)
      .eq('service', 'google')
      .single()

    if (tokenError || !apiToken) {
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

    const mybusiness = google.mybusinessaccountmanagement({ version: 'v1', auth: oauth2Client })

    try {
      // Fetch reviews using the v4 API endpoint
      const reviewsUrl = `https://mybusiness.googleapis.com/v4/${hotelRecord.google_my_business_location_id}/reviews`
      const response = await fetch(reviewsUrl, {
        headers: {
          'Authorization': `Bearer ${apiToken.access_token}`
        }
      })

      if (!response.ok) {
        console.error('Reviews API error:', await response.text())
        return NextResponse.json({
          error: 'Failed to fetch reviews from Google'
        }, { status: response.status })
      }

      const reviewsData = await response.json()
      const reviews = reviewsData.reviews || []

      // Group reviews by month
      const monthlyStats = new Map<string, { count: number; totalRating: number; reviews: any[] }>()

      reviews.forEach((review: any) => {
        const createTime = new Date(review.createTime)
        const monthKey = `${createTime.getFullYear()}-${String(createTime.getMonth() + 1).padStart(2, '0')}`

        if (!monthlyStats.has(monthKey)) {
          monthlyStats.set(monthKey, { count: 0, totalRating: 0, reviews: [] })
        }

        const stats = monthlyStats.get(monthKey)!
        stats.count++
        stats.totalRating += review.starRating === 'FIVE' ? 5 :
                              review.starRating === 'FOUR' ? 4 :
                              review.starRating === 'THREE' ? 3 :
                              review.starRating === 'TWO' ? 2 : 1
        stats.reviews.push(review)
      })

      // Convert to array and calculate averages
      const monthlyData = Array.from(monthlyStats.entries())
        .map(([month, stats]) => ({
          month,
          count: stats.count,
          averageRating: stats.totalRating / stats.count,
          reviews: stats.reviews
        }))
        .sort((a, b) => b.month.localeCompare(a.month)) // Sort by month descending (newest first)

      // Calculate overall stats
      const totalReviews = reviews.length
      const totalRating = reviews.reduce((sum: number, review: any) => {
        const rating = review.starRating === 'FIVE' ? 5 :
                      review.starRating === 'FOUR' ? 4 :
                      review.starRating === 'THREE' ? 3 :
                      review.starRating === 'TWO' ? 2 : 1
        return sum + rating
      }, 0)
      const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0

      return NextResponse.json({
        totalReviews,
        averageRating,
        monthlyData,
        recentReviews: reviews.slice(0, 10).map((review: any) => ({
          author: review.reviewer?.displayName || 'Anonymous',
          rating: review.starRating === 'FIVE' ? 5 :
                  review.starRating === 'FOUR' ? 4 :
                  review.starRating === 'THREE' ? 3 :
                  review.starRating === 'TWO' ? 2 : 1,
          comment: review.comment || '',
          createTime: review.createTime,
          reviewReply: review.reviewReply?.comment || null
        }))
      })

    } catch (error) {
      console.error('Google My Business API error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch reviews data' },
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
