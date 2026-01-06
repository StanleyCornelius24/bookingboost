-- Function to insert default commission rates for a new hotel
CREATE OR REPLACE FUNCTION insert_default_commission_rates()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default commission rates for the new hotel
  INSERT INTO commission_rates (hotel_id, channel_name, commission_rate, is_active)
  VALUES
    (NEW.id, 'Booking.com', 0.15, true),
    (NEW.id, 'Expedia', 0.18, true),
    (NEW.id, 'Direct Booking', 0.00, true),
    (NEW.id, 'Hotelbeds', 0.20, true),
    (NEW.id, 'followme2AFRICA', 0.10, true),
    (NEW.id, 'Tourplan', 0.10, true),
    (NEW.id, 'Thompsons Holidays', 0.15, true),
    (NEW.id, 'Holiday Travel Group', 0.15, true),
    (NEW.id, 'Thompsons Africa (New)', 0.15, true),
    (NEW.id, 'Airbnb', 0.15, true),
    (NEW.id, 'Agoda', 0.16, true),
    (NEW.id, 'Hotels.com', 0.18, true),
    (NEW.id, 'Sabre', 0.12, true),
    (NEW.id, 'Amadeus', 0.12, true),
    (NEW.id, 'Other', 0.10, true)
  ON CONFLICT (hotel_id, channel_name) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run after hotel insert
DROP TRIGGER IF EXISTS trigger_insert_default_commission_rates ON hotels;
CREATE TRIGGER trigger_insert_default_commission_rates
  AFTER INSERT ON hotels
  FOR EACH ROW
  EXECUTE FUNCTION insert_default_commission_rates();

-- Also insert default rates for any existing hotels that don't have them yet
INSERT INTO commission_rates (hotel_id, channel_name, commission_rate, is_active)
SELECT
  h.id,
  channel.name,
  channel.rate,
  true
FROM hotels h
CROSS JOIN (
  VALUES
    ('Booking.com', 0.15),
    ('Expedia', 0.18),
    ('Direct Booking', 0.00),
    ('Hotelbeds', 0.20),
    ('followme2AFRICA', 0.10),
    ('Tourplan', 0.10),
    ('Thompsons Holidays', 0.15),
    ('Holiday Travel Group', 0.15),
    ('Thompsons Africa (New)', 0.15),
    ('Airbnb', 0.15),
    ('Agoda', 0.16),
    ('Hotels.com', 0.18),
    ('Sabre', 0.12),
    ('Amadeus', 0.12),
    ('Other', 0.10)
) AS channel(name, rate)
WHERE NOT EXISTS (
  SELECT 1 FROM commission_rates cr
  WHERE cr.hotel_id = h.id
)
ON CONFLICT (hotel_id, channel_name) DO NOTHING;
