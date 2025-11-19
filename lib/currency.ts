// Currency utilities for BookingBoost

export interface CurrencyInfo {
  code: string
  symbol: string
  name: string
  locale: string
}

// Common hotel industry currencies
export const SUPPORTED_CURRENCIES: Record<string, CurrencyInfo> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP' },
  CHF: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', locale: 'de-CH' },
  SEK: { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', locale: 'sv-SE' },
  NOK: { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', locale: 'nb-NO' },
  DKK: { code: 'DKK', symbol: 'kr', name: 'Danish Krone', locale: 'da-DK' },
  THB: { code: 'THB', symbol: '฿', name: 'Thai Baht', locale: 'th-TH' },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG' },
  HKD: { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', locale: 'en-HK' },
  NZD: { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', locale: 'en-NZ' },
  MXN: { code: 'MXN', symbol: '$', name: 'Mexican Peso', locale: 'es-MX' },
  BRL: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', locale: 'pt-BR' },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
  CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', locale: 'zh-CN' },
  KRW: { code: 'KRW', symbol: '₩', name: 'South Korean Won', locale: 'ko-KR' },
  ZAR: { code: 'ZAR', symbol: 'R', name: 'South African Rand', locale: 'en-ZA' }
}

/**
 * Format a monetary value with proper currency display
 */
export function formatCurrency(
  amount: number,
  currencyCode: string,
  options?: Intl.NumberFormatOptions
): string {
  const currency = SUPPORTED_CURRENCIES[currencyCode]

  if (!currency) {
    // Fallback for unsupported currencies
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...options
    }).format(amount)
  }

  return new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options
  }).format(amount)
}

/**
 * Format a monetary value with compact notation for large amounts
 */
export function formatCurrencyCompact(
  amount: number,
  currencyCode: string
): string {
  return formatCurrency(amount, currencyCode, {
    notation: 'compact',
    maximumFractionDigits: 1
  })
}

/**
 * Get currency symbol for a given currency code
 */
export function getCurrencySymbol(currencyCode: string): string {
  return SUPPORTED_CURRENCIES[currencyCode]?.symbol || currencyCode
}

/**
 * Get currency info for a given currency code
 */
export function getCurrencyInfo(currencyCode: string): CurrencyInfo | null {
  return SUPPORTED_CURRENCIES[currencyCode] || null
}

/**
 * Get list of all supported currencies for dropdowns
 */
export function getSupportedCurrencies(): CurrencyInfo[] {
  return Object.values(SUPPORTED_CURRENCIES)
}

/**
 * Validate if a currency code is supported
 */
export function isSupportedCurrency(currencyCode: string): boolean {
  return currencyCode in SUPPORTED_CURRENCIES
}