-- Create a function to safely execute SELECT queries
-- This is used by the AI chatbot to run generated SQL queries

CREATE OR REPLACE FUNCTION execute_safe_query(
  query_text TEXT,
  hotel_id_param UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  upper_query TEXT;
BEGIN
  -- Convert query to uppercase for checking
  upper_query := UPPER(TRIM(query_text));

  -- Security: Only allow SELECT queries
  IF NOT (upper_query LIKE 'SELECT %') THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;

  -- Security: Block dangerous keywords
  IF upper_query ~* '\b(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|GRANT|REVOKE|TRUNCATE|EXEC|EXECUTE)\b' THEN
    RAISE EXCEPTION 'Query contains forbidden keywords';
  END IF;

  -- Execute the query and return results as JSON
  EXECUTE format('
    WITH query_result AS (
      %s
    )
    SELECT json_agg(query_result.*) FROM query_result
  ', query_text) INTO result;

  RETURN COALESCE(result, '[]'::json);

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Query execution failed: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION execute_safe_query(TEXT, UUID) TO authenticated;

COMMENT ON FUNCTION execute_safe_query IS 'Safely executes SELECT queries for the AI chatbot. Only allows SELECT statements and blocks dangerous operations.';
