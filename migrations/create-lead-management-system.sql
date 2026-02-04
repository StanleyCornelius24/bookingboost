-- =====================================================
-- LEAD MANAGEMENT SYSTEM - DATABASE SCHEMA
-- =====================================================
-- This migration creates all tables for the advanced lead management system
-- Includes: website configs, leads, quality scoring, spam detection, and daily reports

-- =====================================================
-- TABLE: website_configs
-- Purpose: Store configuration for each hotel website integration
-- =====================================================
CREATE TABLE IF NOT EXISTS website_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  website_name VARCHAR(255) NOT NULL,
  website_url VARCHAR(500) NOT NULL,
  form_ids TEXT[] DEFAULT '{}', -- Array of Gravity Forms form IDs
  api_key VARCHAR(255) NOT NULL UNIQUE, -- Format: bba_[32 hex chars]
  webhook_secret VARCHAR(255), -- Optional HMAC secret for webhook verification
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'testing')),
  daily_report_enabled BOOLEAN DEFAULT true,
  daily_report_time VARCHAR(5) DEFAULT '08:00', -- HH:MM format in UTC
  daily_report_email TEXT[] NOT NULL, -- Array of email addresses
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for website_configs
CREATE INDEX idx_website_configs_hotel_id ON website_configs(hotel_id);
CREATE INDEX idx_website_configs_api_key ON website_configs(api_key);
CREATE INDEX idx_website_configs_status ON website_configs(status);

-- =====================================================
-- TABLE: leads
-- Purpose: Store all form submissions from hotel websites
-- =====================================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  website_config_id UUID NOT NULL REFERENCES website_configs(id) ON DELETE CASCADE,

  -- Contact Information
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  message TEXT NOT NULL,

  -- Form Tracking
  form_id VARCHAR(50) NOT NULL, -- Gravity Forms form ID
  form_title VARCHAR(255),
  entry_id VARCHAR(50) NOT NULL, -- Gravity Forms entry ID
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Quality Scoring
  quality_score DECIMAL(3,2) DEFAULT 0 CHECK (quality_score >= 0 AND quality_score <= 1),
  quality_category VARCHAR(10) CHECK (quality_category IN ('high', 'medium', 'low')),
  quality_reasons TEXT[] DEFAULT '{}',

  -- Lead Status
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'spam', 'rejected')),

  -- Spam Detection
  spam_score DECIMAL(3,2) DEFAULT 0 CHECK (spam_score >= 0 AND spam_score <= 1),
  spam_flags TEXT[],
  is_spam BOOLEAN DEFAULT false,
  is_duplicate BOOLEAN DEFAULT false,

  -- Conversion Tracking
  converted BOOLEAN DEFAULT false,
  converted_at TIMESTAMP WITH TIME ZONE,
  booking_reference VARCHAR(100),

  -- Source Tracking
  source_url TEXT,
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  referrer TEXT,
  ip_address VARCHAR(45),

  -- Additional
  notes TEXT,
  webhook_payload JSONB, -- Store complete Gravity Forms payload

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- CRITICAL: Composite unique constraint to prevent collisions across different websites
  CONSTRAINT unique_lead_per_website UNIQUE (website_config_id, form_id, entry_id)
);

-- Indexes for leads
CREATE INDEX idx_leads_hotel_id ON leads(hotel_id);
CREATE INDEX idx_leads_website_config_id ON leads(website_config_id);
CREATE INDEX idx_leads_submitted_at ON leads(submitted_at DESC);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_quality_category ON leads(quality_category);
CREATE INDEX idx_leads_is_spam ON leads(is_spam);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_composite_key ON leads(website_config_id, form_id, entry_id);

-- =====================================================
-- TABLE: lead_quality_scores
-- Purpose: Detailed breakdown of quality scoring components
-- =====================================================
CREATE TABLE IF NOT EXISTS lead_quality_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

  -- Component Scores (0-1 range)
  email_validity_score DECIMAL(3,2) DEFAULT 0,
  phone_validity_score DECIMAL(3,2) DEFAULT 0,
  message_quality_score DECIMAL(3,2) DEFAULT 0,
  engagement_score DECIMAL(3,2) DEFAULT 0,

  -- Quality Indicators
  has_valid_email BOOLEAN DEFAULT false,
  has_valid_phone BOOLEAN DEFAULT false,
  has_detailed_message BOOLEAN DEFAULT false,
  has_booking_keywords BOOLEAN DEFAULT false,

  -- Warnings
  quality_warnings TEXT[],

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_lead_quality_scores_lead_id ON lead_quality_scores(lead_id);

-- =====================================================
-- TABLE: spam_detection_rules
-- Purpose: Configurable spam detection rules (global or per-hotel)
-- =====================================================
CREATE TABLE IF NOT EXISTS spam_detection_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE, -- NULL = global rule

  rule_name VARCHAR(255) NOT NULL,
  rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('email_domain', 'keyword', 'length', 'pattern', 'ip')),
  rule_value TEXT NOT NULL, -- The pattern/value to match
  spam_score_increment DECIMAL(3,2) NOT NULL DEFAULT 0.1 CHECK (spam_score_increment >= 0 AND spam_score_increment <= 1),
  is_blocking BOOLEAN DEFAULT false, -- If true, automatically marks as spam
  enabled BOOLEAN DEFAULT true,
  description TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_spam_rules_hotel_id ON spam_detection_rules(hotel_id);
CREATE INDEX idx_spam_rules_type ON spam_detection_rules(rule_type);
CREATE INDEX idx_spam_rules_enabled ON spam_detection_rules(enabled);

-- =====================================================
-- TABLE: daily_lead_reports
-- Purpose: Store generated daily exception reports
-- =====================================================
CREATE TABLE IF NOT EXISTS daily_lead_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,

  -- Statistics
  total_leads INTEGER DEFAULT 0,
  high_quality_leads INTEGER DEFAULT 0,
  medium_quality_leads INTEGER DEFAULT 0,
  low_quality_leads INTEGER DEFAULT 0,
  spam_leads INTEGER DEFAULT 0,
  duplicate_leads INTEGER DEFAULT 0,

  -- Exceptions
  exceptions JSONB DEFAULT '[]', -- Array of exception objects
  exception_count INTEGER DEFAULT 0,

  -- Report Content
  report_summary TEXT,
  report_html TEXT,

  -- Delivery
  sent_at TIMESTAMP WITH TIME ZONE,
  sent_to TEXT[] NOT NULL,
  delivery_status VARCHAR(20) DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'failed')),
  delivery_error TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_daily_report UNIQUE (hotel_id, report_date)
);

CREATE INDEX idx_daily_reports_hotel_id ON daily_lead_reports(hotel_id);
CREATE INDEX idx_daily_reports_date ON daily_lead_reports(report_date DESC);
CREATE INDEX idx_daily_reports_status ON daily_lead_reports(delivery_status);

-- =====================================================
-- TABLE: lead_status_changes
-- Purpose: Audit trail for all lead status and quality changes
-- =====================================================
CREATE TABLE IF NOT EXISTS lead_status_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

  -- Change Details
  field_changed VARCHAR(50) NOT NULL, -- 'status', 'quality_category', 'spam', etc.
  old_value TEXT,
  new_value TEXT NOT NULL,

  -- Who and Why
  changed_by UUID, -- User ID or NULL for system
  change_reason TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_lead_status_changes_lead_id ON lead_status_changes(lead_id);
CREATE INDEX idx_lead_status_changes_created_at ON lead_status_changes(created_at DESC);

-- =====================================================
-- TRIGGERS: Updated At Timestamps
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_website_configs_updated_at
  BEFORE UPDATE ON website_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_spam_rules_updated_at
  BEFORE UPDATE ON spam_detection_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE website_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_quality_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE spam_detection_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_lead_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_status_changes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own hotel's data
CREATE POLICY "Users can view own hotel website configs"
  ON website_configs FOR SELECT
  USING (
    hotel_id IN (
      SELECT id FROM hotels WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own hotel leads"
  ON leads FOR SELECT
  USING (
    hotel_id IN (
      SELECT id FROM hotels WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own hotel quality scores"
  ON lead_quality_scores FOR SELECT
  USING (
    lead_id IN (
      SELECT id FROM leads WHERE hotel_id IN (
        SELECT id FROM hotels WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can view applicable spam rules"
  ON spam_detection_rules FOR SELECT
  USING (
    hotel_id IS NULL OR hotel_id IN (
      SELECT id FROM hotels WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own hotel daily reports"
  ON daily_lead_reports FOR SELECT
  USING (
    hotel_id IN (
      SELECT id FROM hotels WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own hotel status changes"
  ON lead_status_changes FOR SELECT
  USING (
    lead_id IN (
      SELECT id FROM leads WHERE hotel_id IN (
        SELECT id FROM hotels WHERE user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- ADMIN POLICIES (bypass RLS with service role)
-- =====================================================
-- Note: Admin operations will use service role key which bypasses RLS
-- Additional admin-specific policies can be added here if needed

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON TABLE website_configs IS 'Configuration for each hotel website integration with Gravity Forms';
COMMENT ON TABLE leads IS 'All form submissions from hotel websites with quality scoring and spam detection';
COMMENT ON TABLE lead_quality_scores IS 'Detailed breakdown of quality scoring components for each lead';
COMMENT ON TABLE spam_detection_rules IS 'Configurable rules for spam detection (global or per-hotel)';
COMMENT ON TABLE daily_lead_reports IS 'Daily exception reports sent to hotel admins';
COMMENT ON TABLE lead_status_changes IS 'Audit trail for all lead status and quality changes';

COMMENT ON CONSTRAINT unique_lead_per_website ON leads IS 'CRITICAL: Prevents entry ID collisions across different hotel websites';
