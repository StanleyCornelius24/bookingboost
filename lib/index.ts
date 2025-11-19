/**
 * Central export file for lib utilities
 */

// Calculations (includes formatCurrency, formatPercentage)
export * from './calculations'

// Supabase clients
export { createServerClient } from './supabase/server'
export { createBrowserClient } from './supabase/client'

// User utilities
export { getUserRole, getUserHotel, requireUserRole } from './get-user-role'

// Utilities (cn helper)
export { cn, formatDate, calculateROI, getDateRange } from './utils'
