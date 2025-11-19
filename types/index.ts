export interface Hotel {
  id: string
  name: string
  email: string
  currency: string
  user_role: 'agency' | 'client'
  created_at: string
  google_analytics_property_id?: string
  google_ads_customer_id?: string
  google_ads_manager_id?: string
  meta_ad_account_id?: string
  google_my_business_location_id?: string
  user_id: string
}

export interface Booking {
  id: string
  hotel_id: string
  booking_date: string
  checkin_date?: string
  checkout_date?: string
  channel: string
  guest_name?: string
  revenue: number
  nights?: number
  status?: string
  commission_rate?: number
  commission_amount?: number
  created_at: string
}

export interface MarketingMetric {
  id: string
  hotel_id: string
  date: string
  source: 'google_ads' | 'meta_ads' | 'google_analytics'
  metric_type: 'spend' | 'clicks' | 'impressions' | 'sessions' | 'conversions'
  value: number
  created_at: string
}

export interface ApiToken {
  id: string
  hotel_id: string
  service: 'google' | 'meta'
  access_token: string
  refresh_token?: string
  expires_at?: string
  user_email?: string
  created_at: string
}

export interface CommissionRate {
  id: string
  hotel_id: string
  channel_name: string
  commission_rate: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// Dashboard data types
export interface RevenueOverview {
  totalRevenue: number
  currency: string
  directBookingsPercentage: number
  otaBookingsPercentage: number
  marketingSpend: number
  marketingROI: number
  previousMonthComparison: number
}

export interface ChannelPerformance {
  channel: string
  bookingsCount: number
  revenue: number
  commissionPaid: number
  netRevenue: number
  percentageOfTotal: number
  currency: string
}

export interface MarketingPerformance {
  source: string
  spend: number
  revenue: number
  roi: number
  clicks?: number
  impressions?: number
  conversions?: number
}

// types/database.ts (auto-generated from Supabase later)
export type Database = {
  public: {
    Tables: {
      hotels: {
        Row: Hotel
        Insert: Omit<Hotel, 'id' | 'created_at'>
        Update: Partial<Omit<Hotel, 'id' | 'created_at'>>
      }
      bookings: {
        Row: Booking
        Insert: Omit<Booking, 'id' | 'created_at'>
        Update: Partial<Omit<Booking, 'id' | 'created_at'>>
      }
      marketing_metrics: {
        Row: MarketingMetric
        Insert: Omit<MarketingMetric, 'id' | 'created_at'>
        Update: Partial<Omit<MarketingMetric, 'id' | 'created_at'>>
      }
      api_tokens: {
        Row: ApiToken
        Insert: Omit<ApiToken, 'id' | 'created_at'>
        Update: Partial<Omit<ApiToken, 'id' | 'created_at'>>
      }
      commission_rates: {
        Row: CommissionRate
        Insert: Omit<CommissionRate, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<CommissionRate, 'id' | 'created_at' | 'updated_at'>>
      }
    }
  }
}