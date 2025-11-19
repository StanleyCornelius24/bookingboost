-- Drop and recreate Row-Level Security Policies for BookingBoost

-- Drop existing policies for hotels table
DROP POLICY IF EXISTS "Users can insert their own hotel" ON hotels;
DROP POLICY IF EXISTS "Users can view their own hotel" ON hotels;
DROP POLICY IF EXISTS "Users can update their own hotel" ON hotels;
DROP POLICY IF EXISTS "Users can delete their own hotel" ON hotels;

-- Drop existing policies for bookings table
DROP POLICY IF EXISTS "Users can view their hotel bookings" ON bookings;
DROP POLICY IF EXISTS "Users can insert their hotel bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update their hotel bookings" ON bookings;
DROP POLICY IF EXISTS "Users can delete their hotel bookings" ON bookings;

-- Drop existing policies for commission_rates table
DROP POLICY IF EXISTS "Users can view their hotel commission rates" ON commission_rates;
DROP POLICY IF EXISTS "Users can insert their hotel commission rates" ON commission_rates;
DROP POLICY IF EXISTS "Users can update their hotel commission rates" ON commission_rates;
DROP POLICY IF EXISTS "Users can delete their hotel commission rates" ON commission_rates;

-- Drop existing policies for marketing_metrics table
DROP POLICY IF EXISTS "Users can view their hotel marketing metrics" ON marketing_metrics;
DROP POLICY IF EXISTS "Users can insert their hotel marketing metrics" ON marketing_metrics;
DROP POLICY IF EXISTS "Users can update their hotel marketing metrics" ON marketing_metrics;
DROP POLICY IF EXISTS "Users can delete their hotel marketing metrics" ON marketing_metrics;

-- Drop existing policies for api_tokens table
DROP POLICY IF EXISTS "Users can view their hotel API tokens" ON api_tokens;
DROP POLICY IF EXISTS "Users can insert their hotel API tokens" ON api_tokens;
DROP POLICY IF EXISTS "Users can update their hotel API tokens" ON api_tokens;
DROP POLICY IF EXISTS "Users can delete their hotel API tokens" ON api_tokens;

-- Ensure RLS is enabled
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_tokens ENABLE ROW LEVEL SECURITY;

-- Recreate Hotels table policies
CREATE POLICY "Users can insert their own hotel"
  ON hotels
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own hotel"
  ON hotels
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own hotel"
  ON hotels
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own hotel"
  ON hotels
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Recreate Bookings table policies
CREATE POLICY "Users can view their hotel bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (
    hotel_id IN (
      SELECT id FROM hotels WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their hotel bookings"
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    hotel_id IN (
      SELECT id FROM hotels WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their hotel bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (
    hotel_id IN (
      SELECT id FROM hotels WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their hotel bookings"
  ON bookings
  FOR DELETE
  TO authenticated
  USING (
    hotel_id IN (
      SELECT id FROM hotels WHERE user_id = auth.uid()
    )
  );

-- Recreate Commission rates table policies
CREATE POLICY "Users can view their hotel commission rates"
  ON commission_rates
  FOR SELECT
  TO authenticated
  USING (
    hotel_id IN (
      SELECT id FROM hotels WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their hotel commission rates"
  ON commission_rates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    hotel_id IN (
      SELECT id FROM hotels WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their hotel commission rates"
  ON commission_rates
  FOR UPDATE
  TO authenticated
  USING (
    hotel_id IN (
      SELECT id FROM hotels WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their hotel commission rates"
  ON commission_rates
  FOR DELETE
  TO authenticated
  USING (
    hotel_id IN (
      SELECT id FROM hotels WHERE user_id = auth.uid()
    )
  );

-- Recreate Marketing metrics table policies
CREATE POLICY "Users can view their hotel marketing metrics"
  ON marketing_metrics
  FOR SELECT
  TO authenticated
  USING (
    hotel_id IN (
      SELECT id FROM hotels WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their hotel marketing metrics"
  ON marketing_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (
    hotel_id IN (
      SELECT id FROM hotels WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their hotel marketing metrics"
  ON marketing_metrics
  FOR UPDATE
  TO authenticated
  USING (
    hotel_id IN (
      SELECT id FROM hotels WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their hotel marketing metrics"
  ON marketing_metrics
  FOR DELETE
  TO authenticated
  USING (
    hotel_id IN (
      SELECT id FROM hotels WHERE user_id = auth.uid()
    )
  );

-- Recreate API tokens table policies
CREATE POLICY "Users can view their hotel API tokens"
  ON api_tokens
  FOR SELECT
  TO authenticated
  USING (
    hotel_id IN (
      SELECT id FROM hotels WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their hotel API tokens"
  ON api_tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (
    hotel_id IN (
      SELECT id FROM hotels WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their hotel API tokens"
  ON api_tokens
  FOR UPDATE
  TO authenticated
  USING (
    hotel_id IN (
      SELECT id FROM hotels WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their hotel API tokens"
  ON api_tokens
  FOR DELETE
  TO authenticated
  USING (
    hotel_id IN (
      SELECT id FROM hotels WHERE user_id = auth.uid()
    )
  );
