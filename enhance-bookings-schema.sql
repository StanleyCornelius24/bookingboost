-- Add additional columns to bookings table for NightsBridge data

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS adults INTEGER,
ADD COLUMN IF NOT EXISTS children INTEGER,
ADD COLUMN IF NOT EXISTS room_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS company VARCHAR(255),
ADD COLUMN IF NOT EXISTS extras DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS booking_reference VARCHAR(100),
ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'ZAR',
ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(10,4) DEFAULT 1.0;

-- Add index for booking reference lookups
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON bookings(booking_reference);
CREATE INDEX IF NOT EXISTS idx_bookings_invoice ON bookings(invoice_number);

COMMENT ON COLUMN bookings.adults IS 'Number of adults in the booking';
COMMENT ON COLUMN bookings.children IS 'Number of children in the booking';
COMMENT ON COLUMN bookings.room_name IS 'Name of the room/unit booked';
COMMENT ON COLUMN bookings.company IS 'Company name for corporate bookings';
COMMENT ON COLUMN bookings.extras IS 'Additional charges/extras amount';
COMMENT ON COLUMN bookings.booking_reference IS 'External booking ID/reference from channel manager';
COMMENT ON COLUMN bookings.invoice_number IS 'Invoice number if available';
COMMENT ON COLUMN bookings.currency IS 'Currency code (e.g., ZAR, USD, EUR)';
COMMENT ON COLUMN bookings.exchange_rate IS 'Exchange rate applied to the booking';
