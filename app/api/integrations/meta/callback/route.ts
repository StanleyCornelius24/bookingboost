import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state') // hotel_id
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard-client/settings?error=meta_auth_cancelled`)
    }

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard-client/settings?error=missing_auth_code`)
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.META_APP_ID!,
        client_secret: process.env.META_APP_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/meta/callback`,
        code: code
      })
    })

    const oauthTokenData = await tokenResponse.json()

    if (!oauthTokenData.access_token) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard-client/settings?error=meta_token_failed`)
    }

    // Get long-lived access token
    const longLivedResponse = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const longLivedParams = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: process.env.META_APP_ID!,
      client_secret: process.env.META_APP_SECRET!,
      fb_exchange_token: oauthTokenData.access_token
    })

    const longLivedTokenResponse = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?${longLivedParams}`)
    const longLivedData = await longLivedTokenResponse.json()

    const finalToken = longLivedData.access_token || oauthTokenData.access_token
    const expiresIn = longLivedData.expires_in || oauthTokenData.expires_in

    // Get user info
    const userResponse = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${finalToken}&fields=email,name`)
    const userData = await userResponse.json()

    const supabase = await createServerClient()

    // Store the tokens in the database
    const expiresAt = expiresIn ? new Date(Date.now() + (expiresIn * 1000)).toISOString() : null

    // Prepare the database insertion data
    const insertData: any = {
      hotel_id: state,
      service: 'meta',
      access_token: finalToken,
      expires_at: expiresAt
    }

    // Try to include user_email, but handle gracefully if column doesn't exist
    if (userData.email || userData.name) {
      insertData.user_email = userData.email || userData.name
    }

    const { error: insertError } = await supabase
      .from('api_tokens')
      .upsert(insertData, {
        onConflict: 'hotel_id,service'
      })

    if (insertError) {
      console.error('Database error:', insertError)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard-client/settings?error=database_error`)
    }

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard-client/settings?success=meta_connected`)

  } catch (error) {
    console.error('Meta callback error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard-client/settings?error=meta_auth_failed`)
  }
}