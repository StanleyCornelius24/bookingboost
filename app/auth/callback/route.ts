import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createServerClient()

    // Exchange the code for a session
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Redirect to home page after verification
  // The home layout will redirect to the appropriate dashboard based on role
  return NextResponse.redirect(`${origin}/`)
}
