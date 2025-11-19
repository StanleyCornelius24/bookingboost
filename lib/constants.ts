export const COMMISSION_RATES: Record<string, number> = {
  'Booking.com': 0.15,
  'Expedia': 0.18,
  'Direct Booking': 0.00,
  'Hotelbeds': 0.20,
  'followme2AFRICA': 0.10,
  'Tourplan': 0.10,
  'Thompsons Holidays': 0.15,
  'Holiday Travel Group': 0.15,
  'Thompsons Africa (New)': 0.15,
  'Airbnb': 0.15,
  'Agoda': 0.16,
  'Hotels.com': 0.18,
  'Sabre': 0.12,
  'Amadeus': 0.12,
  'Other': 0.10,
}

export const OTA_CHANNELS = [
  'Booking.com',
  'Expedia',
  'Direct Booking',
  'Hotelbeds',
  'followme2AFRICA',
  'Tourplan',
  'Thompsons Holidays',
  'Holiday Travel Group',
  'Thompsons Africa (New)',
  'Airbnb',
  'Agoda',
  'Hotels.com',
  'Sabre',
  'Amadeus',
  'Other',
] as const

export const MARKETING_SOURCES = {
  GOOGLE_ADS: 'google_ads',
  META_ADS: 'meta_ads',
  GOOGLE_ANALYTICS: 'google_analytics',
} as const

export const METRIC_TYPES = {
  SPEND: 'spend',
  CLICKS: 'clicks',
  IMPRESSIONS: 'impressions',
  SESSIONS: 'sessions',
  CONVERSIONS: 'conversions',
} as const

export const DATE_RANGES = {
  LAST_7_DAYS: 7,
  LAST_30_DAYS: 30,
  LAST_90_DAYS: 90,
  THIS_MONTH: 'month',
  THIS_YEAR: 'year',
} as const