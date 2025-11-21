/**
 * Central export file for lib utilities
 *
 * NOTE: Server-only modules (like createServerClient) should be imported directly:
 * import { createServerClient } from '@/lib/supabase/server'
 */

// Calculations (includes formatCurrency, formatPercentage)
export * from './calculations'

// Client-side Supabase client only
export { createClient } from './supabase/client'

// Utilities (cn helper)
export { cn, formatDate, calculateROI, getDateRange } from './utils'
