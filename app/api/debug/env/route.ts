import { NextResponse } from 'next/server'
import { validateAllEnv } from '@/lib/env-validation'

export async function GET() {
  // Only allow this in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
  }

  const validation = validateAllEnv()

  // Sanitize the response - don't expose actual values
  const response = {
    google: {
      isValid: validation.google.isValid,
      missing: validation.google.missing,
      configured: validation.google.configured.map(key => key + ': ✓')
    },
    meta: {
      isValid: validation.meta.isValid,
      missing: validation.meta.missing,
      configured: validation.meta.configured.map(key => key + ': ✓')
    },
    supabase: {
      isValid: validation.supabase.isValid,
      missing: validation.supabase.missing,
      configured: validation.supabase.configured.map(key => key + ': ✓')
    },
    allValid: validation.allValid,
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
    nodeEnv: process.env.NODE_ENV || 'NOT SET'
  }

  return NextResponse.json(response)
}