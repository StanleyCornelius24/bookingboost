-- Create commission rates management table
-- This table allows hotel owners to customize commission rates per channel

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

-- Create index for better performance
CREATE INDEX idx_commission_rates_hotel_id ON commission_rates(hotel_id);
CREATE INDEX idx_commission_rates_channel ON commission_rates(channel_name);

-- Insert default commission rates for all hotels
-- This will use the current constant values as defaults

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

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_commission_rates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER commission_rates_updated_at_trigger
  BEFORE UPDATE ON commission_rates
  FOR EACH ROW
  EXECUTE FUNCTION update_commission_rates_updated_at();