/*
  # Fix RPC function to bypass RLS for getting user emails

  1. Updates
    - Add SECURITY DEFINER to bypass RLS
    - Use auth.users table directly since public.users has RLS restrictions
    - Only return id and email fields for security

  2. Security
    - Function runs with definer's privileges (bypasses RLS)
    - Still requires authentication to call
    - Only returns email data, no sensitive info
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_user_emails_by_ids(uuid[]);

-- Create new function with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION get_user_emails_by_ids(user_ids uuid[])
RETURNS TABLE(id uuid, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Return user emails from auth.users (bypasses RLS)
  RETURN QUERY
  SELECT 
    au.id,
    au.email
  FROM auth.users au
  WHERE au.id = ANY(user_ids);
END;
$$;