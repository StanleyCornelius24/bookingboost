-- Add booking_engine column to hotels table
ALTER TABLE hotels
ADD COLUMN booking_engine VARCHAR(50) CHECK (booking_engine IN ('NightsBridge', 'Res Request', 'Booking Button', 'Benson', 'Other'));

-- Add index for better performance
CREATE INDEX idx_hotels_booking_engine ON hotels(booking_engine);
