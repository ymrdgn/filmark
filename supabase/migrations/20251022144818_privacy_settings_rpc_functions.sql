/*
  # Privacy Settings RPC Functions
  
  Creates helper functions to bypass PostgREST schema cache issues.
  These functions provide direct database access for privacy settings operations.
  
  1. Functions Created
    - get_user_privacy_settings: Retrieves privacy settings for a user
    - update_user_privacy_settings: Updates or inserts privacy settings
  
  2. Security
    - Functions check authentication via auth.uid()
    - Users can only access their own settings
*/

-- Function to get user privacy settings
CREATE OR REPLACE FUNCTION get_user_privacy_settings(p_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  profile_visibility text,
  show_activity boolean,
  allow_friend_requests boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is authenticated and accessing their own settings
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Return settings, create default if not exists
  RETURN QUERY
  WITH settings AS (
    INSERT INTO user_privacy_settings (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING
    RETURNING *
  )
  SELECT * FROM user_privacy_settings WHERE user_privacy_settings.user_id = p_user_id;
END;
$$;

-- Function to update user privacy settings
CREATE OR REPLACE FUNCTION update_user_privacy_settings(
  p_user_id uuid,
  p_profile_visibility text,
  p_show_activity boolean,
  p_allow_friend_requests boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is authenticated and accessing their own settings
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Validate profile_visibility value
  IF p_profile_visibility NOT IN ('public', 'friends', 'private') THEN
    RAISE EXCEPTION 'Invalid profile_visibility value';
  END IF;

  -- Upsert settings
  INSERT INTO user_privacy_settings (
    user_id,
    profile_visibility,
    show_activity,
    allow_friend_requests,
    updated_at
  )
  VALUES (
    p_user_id,
    p_profile_visibility,
    p_show_activity,
    p_allow_friend_requests,
    now()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    profile_visibility = EXCLUDED.profile_visibility,
    show_activity = EXCLUDED.show_activity,
    allow_friend_requests = EXCLUDED.allow_friend_requests,
    updated_at = now();
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_privacy_settings(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_privacy_settings(uuid, text, boolean, boolean) TO authenticated;
