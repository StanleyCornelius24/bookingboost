-- Complete BookingBoost Database Schema
-- This file contains all tables needed for the application

-- 1. Hotels table (main hotel information)
CREATE TABLE hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  currency VARCHAR(3) DEFAULT 'ZAR',
  user_role TEXT DEFAULT 'client' CHECK (user_role IN ('agency', 'client')),
  google_analytics_property_id VARCHAR(100),
  google_ads_customer_id VARCHAR(50),
  google_ads_manager_id VARCHAR(50),
  meta_ad_account_id VARCHAR(100),
  google_my_business_location_id VARCHAR(100),
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Bookings table (uploaded booking data)
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  checkin_date DATE,
  checkout_date DATE,
  channel VARCHAR(100) NOT NULL,
  guest_name VARCHAR(255),
  revenue DECIMAL(10,2) NOT NULL,
  nights INTEGER,
  status VARCHAR(50),
  commission_rate DECIMAL(5,4),
  commission_amount DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Commission rates table (customizable commission rates per hotel/channel)
CREATE TABLE commission_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  channel_name VARCHAR(100) NOT NULL,
  commission_rate DECIMAL(5,4) NOT NULL CHECK (commission_rate >= 0 AND commission_rate <= 1),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(hotel_id, channel_name)
);

-- 4. Marketing metrics table (Google Ads, Meta Ads, Google Analytics data)
CREATE TABLE marketing_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  source VARCHAR(50) NOT NULL, -- 'google_ads', 'meta_ads', 'google_analytics'
  metric_type VARCHAR(50) NOT NULL, -- 'spend', 'clicks', 'impressions', 'sessions', 'conversions'
  value DECIMAL(15,6) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(hotel_id, date, source, metric_type)
);

-- 5. API tokens table (OAuth tokens for external services)
CREATE TABLE api_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  service VARCHAR(20) NOT NULL, -- 'google', 'meta'
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  user_email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(hotel_id, service)
);

-- Indexes for better performance
CREATE INDEX idx_hotels_user_id ON hotels(user_id);
CREATE INDEX idx_bookings_hotel_id ON bookings(hotel_id);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_channel ON bookings(channel);
CREATE INDEX idx_commission_rates_hotel_id ON commission_rates(hotel_id);
CREATE INDEX idx_commission_rates_channel ON commission_rates(channel_name);
CREATE INDEX idx_marketing_metrics_hotel_id ON marketing_metrics(hotel_id);
CREATE INDEX idx_marketing_metrics_date ON marketing_metrics(date);
CREATE INDEX idx_marketing_metrics_source ON marketing_metrics(source);
CREATE INDEX idx_api_tokens_hotel_id ON api_tokens(hotel_id);

-- Triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_hotels_updated_at
  BEFORE UPDATE ON hotels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commission_rates_updated_at
  BEFORE UPDATE ON commission_rates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default commission rates for existing hotels (run after hotels are created)
-- This will populate commission_rates with industry standard rates
INSERT INTO commission_rates (hotel_id, channel_name, commission_rate)
SELECT
  h.id,
  unnest(ARRAY[
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
    'Other'
  ]) as channel_name,
  unnest(ARRAY[
    0.15,   -- Booking.com
    0.18,   -- Expedia
    0.00,   -- Direct Booking
    0.20,   -- Hotelbeds
    0.10,   -- followme2AFRICA
    0.10,   -- Tourplan
    0.15,   -- Thompsons Holidays
    0.15,   -- Holiday Travel Group
    0.15,   -- Thompsons Africa (New)
    0.15,   -- Airbnb
    0.16,   -- Agoda
    0.18,   -- Hotels.com
    0.12,   -- Sabre
    0.12,   -- Amadeus
    0.10    -- Other
  ]) as commission_rate
FROM hotels h
ON CONFLICT (hotel_id, channel_name) DO NOTHING;