-- Migration: Add multi-hotel support
-- Date: 2026-01-07
-- Description: Adds is_primary and display_order columns to hotels table to support multiple hotels per user

-- Add is_primary column (defaults to false, but we'll set the first hotel for each user to true)
ALTER TABLE hotels
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;

-- Add display_order column for user-defined hotel ordering
ALTER TABLE hotels
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Set existing hotels as primary for their users
UPDATE hotels h1
SET is_primary = true
WHERE id IN (
  SELECT DISTINCT ON (user_id) id
  FROM hotels
  ORDER BY user_id, created_at ASC
);

-- Create index for faster queries on user's hotels
CREATE INDEX IF NOT EXISTS idx_hotels_user_id_display_order ON hotels(user_id, display_order);

-- Add comment for documentation
COMMENT ON COLUMN hotels.is_primary IS 'Indicates if this is the user''s primary/default hotel';
COMMENT ON COLUMN hotels.display_order IS 'User-defined order for displaying hotels (lower numbers first)';

-- Update RLS policies to support multiple hotels per user (they already do, but let's ensure)
-- The existing policies should already work since they use user_id = auth.uid()

-- Optional: Add a trigger to ensure at least one primary hotel per user
CREATE OR REPLACE FUNCTION ensure_one_primary_hotel()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting a hotel as primary, unset others for this user
  IF NEW.is_primary = true THEN
    UPDATE hotels
    SET is_primary = false
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;

  -- If removing primary from the last hotel, prevent it
  IF NEW.is_primary = false THEN
    IF NOT EXISTS (
      SELECT 1 FROM hotels
      WHERE user_id = NEW.user_id AND id != NEW.id AND is_primary = true
    ) THEN
      RAISE EXCEPTION 'Cannot remove primary status from the only hotel';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_one_primary_hotel
  BEFORE UPDATE OF is_primary ON hotels
  FOR EACH ROW
  EXECUTE FUNCTION ensure_one_primary_hotel();
