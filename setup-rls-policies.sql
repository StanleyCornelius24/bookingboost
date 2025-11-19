-- Row-Level Security Policies for BookingBoost
-- These policies allow users to manage their own data

-- Enable RLS on all tables (if not already enabled)
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_tokens ENABLE ROW LEVEL SECURITY;

-- Hotels table policies
-- Allow users to insert their own hotel during signup
CREATE POLICY "Users can insert their own hotel"
  ON hotels
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own hotel
CREATE POLICY "Users can view their own hotel"
  ON hotels
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to update their own hotel
CREATE POLICY "Users can update their own hotel"
  ON hotels
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own hotel
CREATE POLICY "Users can delete their own hotel"
  ON hotels
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Bookings table policies
-- Allow users to view bookings for their hotel
CREATE POLICY "Users can view their hotel bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (
    hotel_id IN (
      SELECT id FROM hotels WHERE user_id = auth.uid()
    )
  );

-- Allow users to insert bookings for their hotel
CREATE POLICY "Users can insert their hotel bookings"
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    hotel_id IN (
      SELECT id FROM hotels WHERE user_id = auth.uid()
    )
  );

-- Allow users to update bookings for their hotel
CREATE POLICY "Users can update their hotel bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (
    hotel_id IN (
      SELECT id FROM hotels WHERE user_id = auth.uid()
    )
  );

-- Allow users to delete bookings for their hotel
CREATE POLICY "Users can delete their hotel bookings"
  ON bookings
  FOR DELETE
  TO authenticated
  USING (
    hotel_id IN (
      SELECT id FROM hotels WHERE user_id = auth.uid()
    )
  );

-- Commission rates table policies
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

-- Marketing metrics table policies
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

-- API tokens table policies
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
