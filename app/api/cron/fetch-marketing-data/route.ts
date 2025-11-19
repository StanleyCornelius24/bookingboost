import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Cron job endpoint to fetch marketing data from all connected platforms
 * This should be called daily to keep marketing metrics up to date
 *
 * Security: Verify the request comes from a trusted source (Vercel Cron or auth header)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authorization (Vercel Cron sends this header)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerClient()

    // Get all hotels with connected marketing accounts
    const { data: apiTokens, error: tokensError } = await supabase
      .from('api_tokens')
      .select('hotel_id, service, access_token, refresh_token')
      .in('service', ['google', 'meta'])

    if (tokensError) {
      console.error('Error fetching API tokens:', tokensError)
      return NextResponse.json({ error: 'Failed to fetch API tokens' }, { status: 500 })
    }

    if (!apiTokens || apiTokens.length === 0) {
      return NextResponse.json({
        message: 'No marketing accounts connected',
        processed: 0
      })
    }

    // Group tokens by hotel
    const hotelTokens = apiTokens.reduce((acc, token) => {
      if (!acc[token.hotel_id]) {
        acc[token.hotel_id] = []
      }
      acc[token.hotel_id].push(token)
      return acc
    }, {} as Record<string, typeof apiTokens>)

    const results = {
      success: [] as string[],
      failed: [] as string[],
      total: Object.keys(hotelTokens).length
    }

    // Fetch data for each hotel
    for (const [hotelId, tokens] of Object.entries(hotelTokens)) {
      try {
        // Get hotel info
        const { data: hotel } = await supabase
          .from('hotels')
          .select('id, name, google_ads_customer_id, google_ads_manager_id, meta_ad_account_id')
          .eq('id', hotelId)
          .single()

        if (!hotel) {
          console.error(`Hotel not found: ${hotelId}`)
          results.failed.push(`Hotel ${hotelId}: not found`)
          continue
        }

        // Calculate date range (last 30 days)
        const endDate = new Date().toISOString().split('T')[0]
        const startDate = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]

        // Fetch Google Ads data
        const hasGoogle = tokens.some(t => t.service === 'google')
        if (hasGoogle && hotel.google_ads_customer_id) {
          try {
            const googleResponse = await fetch(
              `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/ads?startDate=${startDate}&endDate=${endDate}&customerId=${hotel.google_ads_customer_id}${hotel.google_ads_manager_id ? `&loginCustomerId=${hotel.google_ads_manager_id}` : ''}`,
              {
                headers: {
                  'Cookie': `hotel_id=${hotelId}` // Pass hotel context
                }
              }
            )

            if (googleResponse.ok) {
              console.log(`✓ Fetched Google Ads data for ${hotel.name}`)
            } else {
              console.error(`✗ Failed to fetch Google Ads for ${hotel.name}`)
            }
          } catch (error) {
            console.error(`Error fetching Google Ads for ${hotel.name}:`, error)
          }
        }

        // Fetch Google Analytics data
        if (hasGoogle) {
          try {
            const analyticsResponse = await fetch(
              `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/analytics?startDate=${startDate}&endDate=${endDate}`,
              {
                headers: {
                  'Cookie': `hotel_id=${hotelId}`
                }
              }
            )

            if (analyticsResponse.ok) {
              console.log(`✓ Fetched Google Analytics data for ${hotel.name}`)
            }
          } catch (error) {
            console.error(`Error fetching Google Analytics for ${hotel.name}:`, error)
          }
        }

        // Fetch Meta Ads data
        const hasMeta = tokens.some(t => t.service === 'meta')
        if (hasMeta && hotel.meta_ad_account_id) {
          try {
            const metaResponse = await fetch(
              `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/meta/ads?startDate=${startDate}&endDate=${endDate}&adAccountId=${hotel.meta_ad_account_id}`,
              {
                headers: {
                  'Cookie': `hotel_id=${hotelId}`
                }
              }
            )

            if (metaResponse.ok) {
              console.log(`✓ Fetched Meta Ads data for ${hotel.name}`)
            }
          } catch (error) {
            console.error(`Error fetching Meta Ads for ${hotel.name}:`, error)
          }
        }

        // Update last sync time
        await supabase
          .from('hotels')
          .update({
            updated_at: new Date().toISOString(),
            last_marketing_sync: new Date().toISOString()
          })
          .eq('id', hotelId)

        results.success.push(hotel.name)
      } catch (error) {
        console.error(`Error processing hotel ${hotelId}:`, error)
        results.failed.push(`Hotel ${hotelId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      message: 'Marketing data fetch completed',
      results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      {
        error: 'Cron job failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
