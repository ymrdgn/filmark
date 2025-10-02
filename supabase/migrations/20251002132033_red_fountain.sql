/*
  # Add RPC function to get user emails by IDs

  1. New Functions
    - `get_user_emails_by_ids`: Gets user emails from auth.users table by user IDs
    
  2. Security
    - Only authenticated users can call this function
    - Returns email data for valid user IDs
*/

CREATE OR REPLACE FUNCTION get_user_emails_by_ids(user_ids uuid[])
RETURNS TABLE(id uuid, email text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow authenticated users to call this function
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT 
    au.id,
    au.email
  FROM auth.users au
  WHERE au.id = ANY(user_ids);
END;
$$;