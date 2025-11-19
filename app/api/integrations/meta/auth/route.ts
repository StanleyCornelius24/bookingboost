import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Validate environment variables
    if (!process.env.META_APP_ID) {
      return NextResponse.json({ error: 'Meta App ID not configured' }, { status: 500 })
    }
    if (!process.env.META_APP_SECRET) {
      return NextResponse.json({ error: 'Meta App Secret not configured' }, { status: 500 })
    }
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      return NextResponse.json({ error: 'App URL not configured' }, { status: 500 })
    }

    const supabase = await createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get hotel
    const { data: hotel } = await supabase
      .from('hotels')
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })
    }

    const scopes = [
      'ads_read',
      'business_management',
      'pages_read_engagement'
    ].join(',')

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/meta/callback`

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${process.env.META_APP_ID}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${scopes}&` +
      `state=${hotel.id}&` +
      `response_type=code`

    console.log('Generated Meta auth URL:', authUrl)
    console.log('Meta App ID:', process.env.META_APP_ID)
    console.log('Redirect URI:', redirectUri)

    return NextResponse.json({ authUrl })

  } catch (error) {
    console.error('Meta auth error:', error)
    return NextResponse.json(
      { error: 'Failed to generate auth URL', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}