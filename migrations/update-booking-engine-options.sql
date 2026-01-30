-- Drop the existing check constraint
ALTER TABLE hotels DROP CONSTRAINT IF EXISTS hotels_booking_engine_check;

-- Update any existing values to match new format
UPDATE hotels SET booking_engine = 'Nightsbridge' WHERE booking_engine = 'NightsBridge';
UPDATE hotels SET booking_engine = 'Other' WHERE booking_engine = 'Res Request' OR booking_engine NOT IN (
    'Booking Button',
    'ResNova',
    'NA',
    'Synxis',
    'Activitar',
    'Benson',
    'Nightsbridge',
    'Cloudbeds',
    'Profitroom',
    'Activity Bridge',
    'HTI',
    'Other'
) AND booking_engine IS NOT NULL;

-- Add the new constraint with all booking engine options
ALTER TABLE hotels
ADD CONSTRAINT hotels_booking_engine_check CHECK (
  booking_engine IS NULL OR booking_engine IN (
    'Booking Button',
    'ResNova',
    'NA',
    'Synxis',
    'Activitar',
    'Benson',
    'Nightsbridge',
    'Cloudbeds',
    'Profitroom',
    'Activity Bridge',
    'HTI',
    'Other'
  )
);
