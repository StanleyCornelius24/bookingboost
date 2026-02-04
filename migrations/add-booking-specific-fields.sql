-- =====================================================
-- ADD BOOKING-SPECIFIC FIELDS TO LEADS TABLE
-- =====================================================
-- Adds hotel-specific booking fields: arrival, departure, guests, value, etc.

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS enquiry_date DATE,
ADD COLUMN IF NOT EXISTS booked_date DATE,
ADD COLUMN IF NOT EXISTS arrival_date DATE,
ADD COLUMN IF NOT EXISTS departure_date DATE,
ADD COLUMN IF NOT EXISTS adults INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS children INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS interested_in TEXT,
ADD COLUMN IF NOT EXISTS nationality VARCHAR(100),
ADD COLUMN IF NOT EXISTS lead_value DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS lead_source VARCHAR(50) DEFAULT 'form_submission' CHECK (lead_source IN (
  'form_submission',
  'direct_email',
  'phone_call',
  'live_chat',
  'social_media',
  'referral',
  'other'
));

-- Update status field to include more hotel-specific statuses
ALTER TABLE leads
DROP CONSTRAINT IF EXISTS leads_status_check;

ALTER TABLE leads
ADD CONSTRAINT leads_status_check CHECK (status IN (
  'new',
  'contacted',
  'qualified',
  'quote_sent',
  'confirmed',
  'declined',
  'converted',
  'spam',
  'rejected',
  'no_response'
));

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_leads_enquiry_date ON leads(enquiry_date);
CREATE INDEX IF NOT EXISTS idx_leads_booked_date ON leads(booked_date);
CREATE INDEX IF NOT EXISTS idx_leads_arrival_date ON leads(arrival_date);
CREATE INDEX IF NOT EXISTS idx_leads_departure_date ON leads(departure_date);
CREATE INDEX IF NOT EXISTS idx_leads_lead_value ON leads(lead_value DESC);
CREATE INDEX IF NOT EXISTS idx_leads_lead_source ON leads(lead_source);

-- Add comments
COMMENT ON COLUMN leads.enquiry_date IS 'Date when the enquiry was first made';
COMMENT ON COLUMN leads.booked_date IS 'Date when the booking was confirmed';
COMMENT ON COLUMN leads.arrival_date IS 'Requested check-in/arrival date';
COMMENT ON COLUMN leads.departure_date IS 'Requested check-out/departure date';
COMMENT ON COLUMN leads.adults IS 'Number of adult guests';
COMMENT ON COLUMN leads.children IS 'Number of children guests';
COMMENT ON COLUMN leads.interested_in IS 'Room type, package, or service interest';
COMMENT ON COLUMN leads.nationality IS 'Guest nationality';
COMMENT ON COLUMN leads.lead_value IS 'Estimated booking value in hotel currency';
COMMENT ON COLUMN leads.lead_source IS 'How the lead was captured';

-- Update existing leads to have default lead_source
UPDATE leads
SET lead_source = 'form_submission'
WHERE lead_source IS NULL;
