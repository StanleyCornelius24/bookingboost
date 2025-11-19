-- Update Row-Level Security Policies to allow admin access
-- Admins can see all data, regular users can only see their own data

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own hotel" ON hotels;
DROP POLICY IF EXISTS "Users can view their own hotel" ON hotels;
DROP POLICY IF EXISTS "Users can update their own hotel" ON hotels;
DROP POLICY IF EXISTS "Users can delete their own hotel" ON hotels;

DROP POLICY IF EXISTS "Users can view their hotel bookings" ON bookings;
DROP POLICY IF EXISTS "Users can insert their hotel bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update their hotel bookings" ON bookings;
DROP POLICY IF EXISTS "Users can delete their hotel bookings" ON bookings;

DROP POLICY IF EXISTS "Users can view their hotel commission rates" ON commission_rates;
DROP POLICY IF EXISTS "Users can insert their hotel commission rates" ON commission_rates;
DROP POLICY IF EXISTS "Users can update their hotel commission rates" ON commission_rates;
DROP POLICY IF EXISTS "Users can delete their hotel commission rates" ON commission_rates;

DROP POLICY IF EXISTS "Users can view their hotel marketing metrics" ON marketing_metrics;
DROP POLICY IF EXISTS "Users can insert their hotel marketing metrics" ON marketing_metrics;
DROP POLICY IF EXISTS "Users can update their hotel marketing metrics" ON marketing_metrics;
DROP POLICY IF EXISTS "Users can delete their hotel marketing metrics" ON marketing_metrics;

DROP POLICY IF EXISTS "Users can view their hotel API tokens" ON api_tokens;
DROP POLICY IF EXISTS "Users can insert their hotel API tokens" ON api_tokens;
DROP POLICY IF EXISTS "Users can update their hotel API tokens" ON api_tokens;
DROP POLICY IF EXISTS "Users can delete their hotel API tokens" ON api_tokens;

-- Hotels table policies with admin access
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
    -- User can see their own hotel
    auth.uid() = user_id
    OR
    -- Admins can see all hotels
    EXISTS (
      SELECT 1 FROM hotels
      WHERE user_id = auth.uid()
      AND user_role = 'admin'
    )
  );

CREATE POLICY "Users can update hotels"
  ON hotels
  FOR UPDATE
  TO authenticated
  USING (
    -- User can update their own hotel
    auth.uid() = user_id
    OR
    -- Admins can update all hotels
    EXISTS (
      SELECT 1 FROM hotels
      WHERE user_id = auth.uid()
      AND user_role = 'admin'
    )
  )
  WITH CHECK (
    -- User can update their own hotel
    auth.uid() = user_id
    OR
    -- Admins can update all hotels
    EXISTS (
      SELECT 1 FROM hotels
      WHERE user_id = auth.uid()
      AND user_role = 'admin'
    )
  );

CREATE POLICY "Users can delete hotels"
  ON hotels
  FOR DELETE
  TO authenticated
  USING (
    -- User can delete their own hotel
    auth.uid() = user_id
    OR
    -- Admins can delete all hotels
    EXISTS (
      SELECT 1 FROM hotels
      WHERE user_id = auth.uid()
      AND user_role = 'admin'
    )
  );

-- Bookings table policies with admin access
CREATE POLICY "Users can view bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (
    -- User can see bookings for their hotel
    hotel_id IN (
      SELECT id FROM hotels WHERE user_id = auth.uid()
    )
    OR
    -- Admins can see all bookings
    EXISTS (
      SELECT 1 FROM hotels
      WHERE user_id = auth.uid()
      AND user_role = 'admin'
    )
  );

CREATE POLICY "Users can insert bookings"
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User can insert bookings for their hotel
    hotel_id IN (
      SELECT id FROM hotels WHERE user_id = auth.uid()
    )
    OR
    -- Admins can insert bookings for any hotel
    EXISTS (
      SELECT 1 FROM hotels
      WHERE user_id = auth.uid()
      AND user_role = 'admin'
    )
  );

CREATE POLICY "Users can update bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (
    hotel_id IN (
      SELECT id FROM hotels WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM hotels
      WHERE user_id = auth.uid()
      AND user_role = 'admin'
    )
  );

CREATE POLICY "Users can delete bookings"
  ON bookings
  FOR DELETE
  TO authenticated
  USING (
    hotel_id IN (
      SELECT id FROM hotels WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM hotels
      WHERE user_id = auth.uid()
      AND user_role = 'admin'
    )
  );

-- Commission rates table policies with admin access
CREATE POLICY "Users can view commission rates"
  ON commission_rates
  FOR SELECT
  TO authenticated
  USING (
    hotel_id IN (
      SELECT id FROM hotels WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM hotels
      WHERE user_id = auth.uid()
      AND user_role = 'admin'
    )
  );

CREATE POLICY "Users can insert commission rates"
  ON commission_rates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    hotel_id IN (
      SELECT id FROM hotels WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM hotels
      WHERE user_id = auth.uid()
      AND user_role = 'admin'
    )
  );

CREATE POLICY "Users can update commission rates"
  ON commission_rates
  FOR UPDATE
  TO authenticated
  USING (
    hotel_id IN (
      SELECT id FROM hotels WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM hotels
      WHERE user_id = auth.uid()
      AND user_role = 'admin'
    )
  );

CREATE POLICY "Users can delete commission rates"
  ON commission_rates
  FOR DELETE
  TO authenticated
  USING (
    hotel_id IN (
      SELECT id FROM hotels WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM hotels
      WHERE user_id = auth.uid()
      AND user_role = 'admin'
    )
  );

-- Marketing metrics table policies with admin access
CREATE POLICY "Users can view marketing metrics"
  ON marketing_metrics
  FOR SELECT
  TO authenticated
  USING (
    hotel_id IN (
      SELECT id FROM hotels WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM hotels
      WHERE user_id = auth.uid()
      AND user_role = 'admin'
    )
  );

CREATE POLICY "Users can insert marketing metrics"
  ON marketing_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (
    hotel_id IN (
      SELECT id FROM hotels WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM hotels
      WHERE user_id = auth.uid()
      AND user_role = 'admin'
    )
  );

CREATE POLICY "Users can update marketing metrics"
  ON marketing_metrics
  FOR UPDATE
  TO authenticated
  USING (
    hotel_id IN (
      SELECT id FROM hotels WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM hotels
      WHERE user_id = auth.uid()
      AND user_role = 'admin'
    )
  );

CREATE POLICY "Users can delete marketing metrics"
  ON marketing_metrics
  FOR DELETE
  TO authenticated
  USING (
    hotel_id IN (
      SELECT id FROM hotels WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM hotels
      WHERE user_id = auth.uid()
      AND user_role = 'admin'
    )
  );

-- API tokens table policies with admin access
CREATE POLICY "Users can view API tokens"
  ON api_tokens
  FOR SELECT
  TO authenticated
  USING (
    hotel_id IN (
      SELECT id FROM hotels WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM hotels
      WHERE user_id = auth.uid()
      AND user_role = 'admin'
    )
  );

CREATE POLICY "Users can insert API tokens"
  ON api_tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (
    hotel_id IN (
      SELECT id FROM hotels WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM hotels
      WHERE user_id = auth.uid()
      AND user_role = 'admin'
    )
  );

CREATE POLICY "Users can update API tokens"
  ON api_tokens
  FOR UPDATE
  TO authenticated
  USING (
    hotel_id IN (
      SELECT id FROM hotels WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM hotels
      WHERE user_id = auth.uid()
      AND user_role = 'admin'
    )
  );

CREATE POLICY "Users can delete API tokens"
  ON api_tokens
  FOR DELETE
  TO authenticated
  USING (
    hotel_id IN (
      SELECT id FROM hotels WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM hotels
      WHERE user_id = auth.uid()
      AND user_role = 'admin'
    )
  );
