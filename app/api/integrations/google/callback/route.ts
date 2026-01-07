import { google } from 'googleapis'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state') // hotel_id
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard-client/settings?error=google_auth_cancelled`)
    }

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard-client/settings?error=missing_auth_code`)
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/callback`

    console.log('Google callback debug info:')
    console.log('- Client ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing')
    console.log('- Client Secret:', process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Missing')
    console.log('- Redirect URI:', redirectUri)
    console.log('- Received code:', code ? 'Present' : 'Missing')
    console.log('- State:', state)

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    )

    // Exchange code for tokens
    let tokens
    try {
      const tokenResult = await oauth2Client.getToken(code)
      tokens = tokenResult.tokens
      console.log('Token exchange successful')
    } catch (tokenError) {
      console.error('Token exchange failed:', tokenError)
      throw tokenError
    }
    oauth2Client.setCredentials(tokens)

    // Get user info to verify the connection
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    const userInfo = await oauth2.userinfo.get()

    const supabase = await createServerClient()

    // If no refresh token in response, try to preserve the existing one
    let finalRefreshToken = tokens.refresh_token
    if (!finalRefreshToken) {
      const { data: existingToken } = await supabase
        .from('api_tokens')
        .select('refresh_token')
        .eq('hotel_id', state)
        .eq('service', 'google')
        .maybeSingle()

      if (existingToken?.refresh_token) {
        console.log('Preserving existing refresh token')
        finalRefreshToken = existingToken.refresh_token
      }
    }

    // Store the tokens in the database
    // Prepare the data object - only include user_email if the column exists
    const tokenData: any = {
      hotel_id: state,
      service: 'google',
      access_token: tokens.access_token!,
      refresh_token: finalRefreshToken || null,
      expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null
    }

    // Try to include user_email, but handle gracefully if column doesn't exist
    if (userInfo.data.email) {
      tokenData.user_email = userInfo.data.email
    }

    console.log('Storing tokens with refresh_token:', finalRefreshToken ? 'Present' : 'Missing')

    const { error: insertError } = await supabase
      .from('api_tokens')
      .upsert(tokenData, {
        onConflict: 'hotel_id,service'
      })

    if (insertError) {
      console.error('Database error:', insertError)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard-client/settings?error=database_error`)
    }

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard-client/settings?success=google_connected`)

  } catch (error) {
    console.error('Google callback error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard-client/settings?error=google_auth_failed`)
  }
}