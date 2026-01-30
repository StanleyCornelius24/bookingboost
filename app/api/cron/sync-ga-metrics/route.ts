import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { google } from 'googleapis'

// Use service role key for cron jobs
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function GET(request: NextRequest) {
  // Verify the request is from a cron job (you can use a secret token)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET || 'your-secret-key'

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('Starting GA metrics sync...')

    // Get all hotels with Google Analytics configured
    const { data: hotels, error: hotelsError } = await supabase
      .from('hotels')
      .select('id, name, google_analytics_property_id')
      .not('google_analytics_property_id', 'is', null)

    if (hotelsError) {
      console.error('Error fetching hotels:', hotelsError)
      return NextResponse.json({ error: 'Failed to fetch hotels' }, { status: 500 })
    }

    console.log(`Found ${hotels?.length || 0} hotels with GA configured`)

    // Get date from query param or default to yesterday
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')

    let dateString: string
    if (dateParam) {
      // Validate date format YYYY-MM-DD
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
        return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 })
      }
      dateString = dateParam
      console.log(`Fetching data for specified date: ${dateString}`)
    } else {
      // Default to yesterday's data
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      dateString = yesterday.toISOString().split('T')[0]
      console.log(`Fetching data for yesterday: ${dateString}`)
    }

    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    // Process each hotel
    for (const hotel of hotels || []) {
      try {
        console.log(`Processing ${hotel.name} (${hotel.id})...`)

        // Get access token for this hotel
        const { data: tokenData, error: tokenError } = await supabase
          .from('api_tokens')
          .select('access_token, refresh_token')
          .eq('hotel_id', hotel.id)
          .eq('service', 'google')
          .single()

        if (tokenError || !tokenData) {
          console.log(`No Google tokens for ${hotel.name}, skipping...`)
          continue
        }

        // Set up Google Analytics client with OAuth2
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET
        )

        oauth2Client.setCredentials({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
        })

        const analyticsData = google.analyticsdata({ version: 'v1beta', auth: oauth2Client })

        // Fetch GA data
        const response = await analyticsData.properties.runReport({
          property: `properties/${hotel.google_analytics_property_id}`,
          requestBody: {
            dateRanges: [{
              startDate: dateString,
              endDate: dateString
            }],
            metrics: [
              { name: 'activeUsers' },
              { name: 'sessions' },
              { name: 'screenPageViews' },
              { name: 'bounceRate' },
              { name: 'averageSessionDuration' }
            ]
          }
        })

        // Extract metrics
        const row = response.data.rows?.[0]
        const users = row?.metricValues?.[0]?.value ? parseInt(row.metricValues[0].value) : 0
        const sessions = row?.metricValues?.[1]?.value ? parseInt(row.metricValues[1].value) : 0
        const pageViews = row?.metricValues?.[2]?.value ? parseInt(row.metricValues[2].value) : 0
        const bounceRate = row?.metricValues?.[3]?.value ? parseFloat(row.metricValues[3].value) * 100 : 0
        const avgSessionDuration = row?.metricValues?.[4]?.value ? parseFloat(row.metricValues[4].value) : 0

        console.log(`${hotel.name} metrics:`, { users, sessions, pageViews })

        // Upsert metrics into database
        const { error: upsertError } = await supabase
          .from('hotel_metrics')
          .upsert(
            {
              hotel_id: hotel.id,
              date: dateString,
              users,
              sessions,
              page_views: pageViews,
              bounce_rate: bounceRate,
              avg_session_duration: avgSessionDuration,
              updated_at: new Date().toISOString()
            },
            {
              onConflict: 'hotel_id,date'
            }
          )

        if (upsertError) {
          console.error(`Error upserting metrics for ${hotel.name}:`, upsertError)
          errorCount++
          errors.push(`${hotel.name}: ${upsertError.message}`)
        } else {
          successCount++
          console.log(`Successfully synced metrics for ${hotel.name}`)
        }

      } catch (error) {
        console.error(`Error processing ${hotel.name}:`, error)
        errorCount++
        errors.push(`${hotel.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    console.log(`GA metrics sync complete. Success: ${successCount}, Errors: ${errorCount}`)

    return NextResponse.json({
      success: true,
      date: dateString,
      hotelsProcessed: hotels?.length || 0,
      successCount,
      errorCount,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Error in GA metrics sync:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync metrics' },
      { status: 500 }
    )
  }
}
