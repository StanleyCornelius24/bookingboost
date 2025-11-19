// Environment variable validation utilities

export interface EnvValidationResult {
  isValid: boolean
  missing: string[]
  configured: string[]
}

export function validateGoogleEnv(): EnvValidationResult {
  const required = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'NEXT_PUBLIC_APP_URL'
  ]

  // GOOGLE_ADS_DEVELOPER_TOKEN is optional - only needed for Google Ads API
  const optional = [
    'GOOGLE_ADS_DEVELOPER_TOKEN'
  ]

  const missing: string[] = []
  const configured: string[] = []

  required.forEach(key => {
    if (!process.env[key]) {
      missing.push(key)
    } else {
      configured.push(key)
    }
  })

  return {
    isValid: missing.length === 0,
    missing,
    configured
  }
}

export function validateMetaEnv(): EnvValidationResult {
  const required = [
    'META_APP_ID',
    'META_APP_SECRET',
    'NEXT_PUBLIC_APP_URL'
  ]

  const missing: string[] = []
  const configured: string[] = []

  required.forEach(key => {
    if (!process.env[key]) {
      missing.push(key)
    } else {
      configured.push(key)
    }
  })

  return {
    isValid: missing.length === 0,
    missing,
    configured
  }
}

export function validateSupabaseEnv(): EnvValidationResult {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ]

  const missing: string[] = []
  const configured: string[] = []

  required.forEach(key => {
    if (!process.env[key]) {
      missing.push(key)
    } else {
      configured.push(key)
    }
  })

  return {
    isValid: missing.length === 0,
    missing,
    configured
  }
}

export function validateAllEnv() {
  const google = validateGoogleEnv()
  const meta = validateMetaEnv()
  const supabase = validateSupabaseEnv()

  return {
    google,
    meta,
    supabase,
    allValid: google.isValid && meta.isValid && supabase.isValid
  }
}