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

// =====================================================
// LEAD MANAGEMENT SYSTEM TYPES
// =====================================================

/**
 * Website Configuration - Stores integration settings for each hotel website
 */
export interface WebsiteConfig {
  id: string
  hotel_id: string
  website_name: string
  website_url: string
  form_ids: string[] // Array of Gravity Forms form IDs
  api_key: string // Format: bba_[32 hex chars]
  webhook_secret: string | null // Optional HMAC secret
  status: 'active' | 'inactive' | 'testing'
  daily_report_enabled: boolean
  daily_report_time: string // HH:MM format in UTC
  daily_report_email: string[] // Array of email addresses
  last_sync_at: string | null
  created_at: string
  updated_at: string
}

/**
 * Lead - Form submission from a hotel website
 */
export interface Lead {
  id: string
  hotel_id: string
  website_config_id: string

  // Contact Information
  name: string
  email: string | null
  phone: string | null
  message: string

  // Booking Details
  enquiry_date: string | null
  booked_date: string | null
  arrival_date: string | null
  departure_date: string | null
  adults: number
  children: number
  interested_in: string | null
  nationality: string | null

  // Lead Value & Source
  lead_value: number
  lead_source: 'form_submission' | 'direct_email' | 'phone_call' | 'live_chat' | 'social_media' | 'referral' | 'other'

  // Form Tracking
  form_id: string
  form_title: string | null
  entry_id: string
  submitted_at: string

  // Quality Scoring
  quality_score: number // 0-1
  quality_category: 'high' | 'medium' | 'low' | null
  quality_reasons: string[]

  // Lead Status
  status: 'new' | 'contacted' | 'qualified' | 'quote_sent' | 'confirmed' | 'declined' | 'converted' | 'spam' | 'rejected' | 'no_response'

  // Spam Detection
  spam_score: number // 0-1
  spam_flags: string[] | null
  is_spam: boolean
  is_duplicate: boolean

  // Conversion Tracking
  converted: boolean
  converted_at: string | null
  booking_reference: string | null

  // Source Tracking
  source_url: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  referrer: string | null
  ip_address: string | null

  // Additional
  notes: string | null
  webhook_payload: Record<string, any> | null

  created_at: string
  updated_at: string
}

/**
 * Lead Quality Score - Detailed breakdown of quality components
 */
export interface LeadQualityScore {
  id: string
  lead_id: string

  // Component Scores (0-1 range)
  email_validity_score: number
  phone_validity_score: number
  message_quality_score: number
  engagement_score: number

  // Quality Indicators
  has_valid_email: boolean
  has_valid_phone: boolean
  has_detailed_message: boolean
  has_booking_keywords: boolean

  // Warnings
  quality_warnings: string[] | null

  created_at: string
}

/**
 * Spam Detection Rule - Configurable rule for spam detection
 */
export interface SpamDetectionRule {
  id: string
  hotel_id: string | null // NULL = global rule

  rule_name: string
  rule_type: 'email_domain' | 'keyword' | 'length' | 'pattern' | 'ip'
  rule_value: string
  spam_score_increment: number
  is_blocking: boolean
  enabled: boolean
  description: string | null

  created_at: string
  updated_at: string
}

/**
 * Daily Lead Report - Daily exception report for a hotel
 */
export interface DailyLeadReport {
  id: string
  hotel_id: string
  report_date: string

  // Statistics
  total_leads: number
  high_quality_leads: number
  medium_quality_leads: number
  low_quality_leads: number
  spam_leads: number
  duplicate_leads: number

  // Exceptions
  exceptions: Exception[]
  exception_count: number

  // Report Content
  report_summary: string | null
  report_html: string | null

  // Delivery
  sent_at: string | null
  sent_to: string[]
  delivery_status: 'pending' | 'sent' | 'failed'
  delivery_error: string | null

  created_at: string
}

/**
 * Exception - An item in the daily report exceptions list
 */
export interface Exception {
  type: string
  count: number
  details: string
  severity: 'warning' | 'error'
}

/**
 * Lead Status Change - Audit trail entry for lead changes
 */
export interface LeadStatusChange {
  id: string
  lead_id: string

  field_changed: string
  old_value: string | null
  new_value: string

  changed_by: string | null // User ID or NULL for system
  change_reason: string | null

  created_at: string
}

/**
 * Report Statistics - Used for generating reports
 */
export interface ReportStats {
  total_leads: number
  high_quality_leads: number
  medium_quality_leads: number
  low_quality_leads: number
  spam_leads: number
  duplicate_leads: number
}

/**
 * Website Info - Used in report generation
 */
export interface WebsiteInfo {
  website_name: string
  website_url: string
  lead_count: number
  high_quality_count: number
}

/**
 * Quality Score Result - Returned from quality calculation
 */
export interface QualityScoreResult {
  score: number
  category: 'high' | 'medium' | 'low'
  reasons: string[]
}

/**
 * Spam Score Result - Returned from spam calculation
 */
export interface SpamScoreResult {
  score: number
  flags: string[]
  isSpam: boolean
}

/**
 * Duplicate Check Result - Returned from duplicate detection
 */
export interface DuplicateCheckResult {
  isDuplicate: boolean
  existingLeadId?: string
}

// =====================================================
// END LEAD MANAGEMENT TYPES
// =====================================================

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
      website_configs: {
        Row: WebsiteConfig
        Insert: Omit<WebsiteConfig, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<WebsiteConfig, 'id' | 'created_at' | 'updated_at'>>
      }
      leads: {
        Row: Lead
        Insert: Omit<Lead, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Lead, 'id' | 'created_at' | 'updated_at'>>
      }
      lead_quality_scores: {
        Row: LeadQualityScore
        Insert: Omit<LeadQualityScore, 'id' | 'created_at'>
        Update: Partial<Omit<LeadQualityScore, 'id' | 'created_at'>>
      }
      spam_detection_rules: {
        Row: SpamDetectionRule
        Insert: Omit<SpamDetectionRule, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<SpamDetectionRule, 'id' | 'created_at' | 'updated_at'>>
      }
      daily_lead_reports: {
        Row: DailyLeadReport
        Insert: Omit<DailyLeadReport, 'id' | 'created_at'>
        Update: Partial<Omit<DailyLeadReport, 'id' | 'created_at'>>
      }
      lead_status_changes: {
        Row: LeadStatusChange
        Insert: Omit<LeadStatusChange, 'id' | 'created_at'>
        Update: Partial<Omit<LeadStatusChange, 'id' | 'created_at'>>
      }
    }
  }
}