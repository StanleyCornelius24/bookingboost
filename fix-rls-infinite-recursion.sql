-- Fix infinite recursion in RLS policies by using a helper function

-- First, drop all existing policies
DROP POLICY IF EXISTS "Users can insert their own hotel" ON hotels;
DROP POLICY IF EXISTS "Users can view hotels" ON hotels;
DROP POLICY IF EXISTS "Users can update hotels" ON hotels;
DROP POLICY IF EXISTS "Users can delete hotels" ON hotels;

DROP POLICY IF EXISTS "Users can view bookings" ON bookings;
DROP POLICY IF EXISTS "Users can insert bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update bookings" ON bookings;
DROP POLICY IF EXISTS "Users can delete bookings" ON bookings;

DROP POLICY IF EXISTS "Users can view commission rates" ON commission_rates;
DROP POLICY IF EXISTS "Users can insert commission rates" ON commission_rates;
DROP POLICY IF EXISTS "Users can update commission rates" ON commission_rates;
DROP POLICY IF EXISTS "Users can delete commission rates" ON commission_rates;

DROP POLICY IF EXISTS "Users can view marketing metrics" ON marketing_metrics;
DROP POLICY IF EXISTS "Users can insert marketing metrics" ON marketing_metrics;
DROP POLICY IF EXISTS "Users can update marketing metrics" ON marketing_metrics;
DROP POLICY IF EXISTS "Users can delete marketing metrics" ON marketing_metrics;

DROP POLICY IF EXISTS "Users can view API tokens" ON api_tokens;
DROP POLICY IF EXISTS "Users can insert API tokens" ON api_tokens;
DROP POLICY IF EXISTS "Users can update API tokens" ON api_tokens;
DROP POLICY IF EXISTS "Users can delete API tokens" ON api_tokens;

-- Create a helper function to check if a user is an admin
-- SECURITY DEFINER allows this function to bypass RLS when checking the role
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM hotels
    WHERE user_id = auth.uid()
    AND user_role = 'admin'
  );
END;
$$;

-- Hotels table policies
CREATE POLICY "Users can insert their own hotel"
  ON hotels
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view hotels"
  ON hotels
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id  -- User can see their own hotel
    OR is_admin()         -- OR user is an admin
  );

CREATE POLICY "Users can update hotels"
  ON hotels
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR is_admin()
  )
  WITH CHECK (
    auth.uid() = user_id
    OR is_admin()
  );

CREATE POLICY "Users can delete hotels"
  ON hotels
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR is_admin()
  );

-- Bookings table policies
CREATE POLICY "Users can view bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (
    hotel_id IN (SELECT id FROM hotels WHERE user_id = auth.uid())
    OR is_admin()
  );

CREATE POLICY "Users can insert bookings"
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    hotel_id IN (SELECT id FROM hotels WHERE user_id = auth.uid())
    OR is_admin()
  );

CREATE POLICY "Users can update bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (
    hotel_id IN (SELECT id FROM hotels WHERE user_id = auth.uid())
    OR is_admin()
  );

CREATE POLICY "Users can delete bookings"
  ON bookings
  FOR DELETE
  TO authenticated
  USING (
    hotel_id IN (SELECT id FROM hotels WHERE user_id = auth.uid())
    OR is_admin()
  );

-- Commission rates table policies
CREATE POLICY "Users can view commission rates"
  ON commission_rates
  FOR SELECT
  TO authenticated
  USING (
    hotel_id IN (SELECT id FROM hotels WHERE user_id = auth.uid())
    OR is_admin()
  );

CREATE POLICY "Users can insert commission rates"
  ON commission_rates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    hotel_id IN (SELECT id FROM hotels WHERE user_id = auth.uid())
    OR is_admin()
  );

CREATE POLICY "Users can update commission rates"
  ON commission_rates
  FOR UPDATE
  TO authenticated
  USING (
    hotel_id IN (SELECT id FROM hotels WHERE user_id = auth.uid())
    OR is_admin()
  );

CREATE POLICY "Users can delete commission rates"
  ON commission_rates
  FOR DELETE
  TO authenticated
  USING (
    hotel_id IN (SELECT id FROM hotels WHERE user_id = auth.uid())
    OR is_admin()
  );

-- Marketing metrics table policies
CREATE POLICY "Users can view marketing metrics"
  ON marketing_metrics
  FOR SELECT
  TO authenticated
  USING (
    hotel_id IN (SELECT id FROM hotels WHERE user_id = auth.uid())
    OR is_admin()
  );

CREATE POLICY "Users can insert marketing metrics"
  ON marketing_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (
    hotel_id IN (SELECT id FROM hotels WHERE user_id = auth.uid())
    OR is_admin()
  );

CREATE POLICY "Users can update marketing metrics"
  ON marketing_metrics
  FOR UPDATE
  TO authenticated
  USING (
    hotel_id IN (SELECT id FROM hotels WHERE user_id = auth.uid())
    OR is_admin()
  );

CREATE POLICY "Users can delete marketing metrics"
  ON marketing_metrics
  FOR DELETE
  TO authenticated
  USING (
    hotel_id IN (SELECT id FROM hotels WHERE user_id = auth.uid())
    OR is_admin()
  );

-- API tokens table policies
CREATE POLICY "Users can view API tokens"
  ON api_tokens
  FOR SELECT
  TO authenticated
  USING (
    hotel_id IN (SELECT id FROM hotels WHERE user_id = auth.uid())
    OR is_admin()
  );

CREATE POLICY "Users can insert API tokens"
  ON api_tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (
    hotel_id IN (SELECT id FROM hotels WHERE user_id = auth.uid())
    OR is_admin()
  );

CREATE POLICY "Users can update API tokens"
  ON api_tokens
  FOR UPDATE
  TO authenticated
  USING (
    hotel_id IN (SELECT id FROM hotels WHERE user_id = auth.uid())
    OR is_admin()
  );

CREATE POLICY "Users can delete API tokens"
  ON api_tokens
  FOR DELETE
  TO authenticated
  USING (
    hotel_id IN (SELECT id FROM hotels WHERE user_id = auth.uid())
    OR is_admin()
  );
