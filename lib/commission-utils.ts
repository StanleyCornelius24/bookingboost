import { createClient } from '@/lib/supabase/client'
import { COMMISSION_RATES } from '@/lib/constants'

/**
 * Get commission rates for a specific hotel
 * Falls back to constants if no custom rates are found
 */
export async function getCommissionRates(hotelId: string): Promise<Record<string, number>> {
  const supabase = createClient()

  try {
    const { data: customRates } = await supabase
      .from('commission_rates')
      .select('channel_name, commission_rate')
      .eq('hotel_id', hotelId)
      .eq('is_active', true)

    if (!customRates || customRates.length === 0) {
      // Return default constants if no custom rates found
      return COMMISSION_RATES
    }

    // Convert array to object
    const ratesMap: Record<string, number> = {}
    customRates.forEach(rate => {
      ratesMap[rate.channel_name] = rate.commission_rate
    })

    // Merge with defaults for any missing channels
    return { ...COMMISSION_RATES, ...ratesMap }
  } catch (error) {
    console.error('Error fetching commission rates:', error)
    return COMMISSION_RATES
  }
}

/**
 * Get commission rate for a specific channel
 */
export async function getCommissionRate(hotelId: string, channelName: string): Promise<number> {
  const rates = await getCommissionRates(hotelId)
  return rates[channelName] || rates['Other'] || 0.10
}

/**
 * Calculate commission amount for a booking
 */
export function calculateCommission(revenue: number, commissionRate: number): number {
  return revenue * commissionRate
}

/**
 * Calculate net revenue after commission
 */
export function calculateNetRevenue(revenue: number, commissionRate: number): number {
  return revenue - calculateCommission(revenue, commissionRate)
}

/**
 * Server-side version for API routes
 */
export async function getCommissionRatesServer(hotelId: string): Promise<Record<string, number>> {
  // This would use server-side Supabase client
  // For now, return constants - can be enhanced later
  return COMMISSION_RATES
}