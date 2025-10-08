/*
  # Fix delete user account function

  1. New Function
    - `delete_user_account()` - Permanently deletes a user and all their data
    - Deletes movies, TV shows, lists, list items, friends, achievements, and notifications
    - Uses proper CASCADE to handle related data automatically

  2. Security
    - Function executes with SECURITY DEFINER (elevated privileges)
    - User can only delete their own account (auth.uid() check)

  3. Important Notes
    - This is a destructive operation with no recovery
    - All user data is permanently deleted
    - User session will be invalidated after deletion
*/

-- Drop existing function if any
DROP FUNCTION IF EXISTS delete_user_account();

-- Create function to delete user account and all related data
CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get the current authenticated user ID
  current_user_id := auth.uid();
  
  -- Check if user is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete all user-related data in correct order (to avoid FK conflicts)
  DELETE FROM user_achievements WHERE user_id = current_user_id;
  DELETE FROM notifications WHERE user_id = current_user_id;
  DELETE FROM friends WHERE user_id = current_user_id OR friend_id = current_user_id;
  DELETE FROM list_items WHERE list_id IN (SELECT id FROM custom_lists WHERE user_id = current_user_id);
  DELETE FROM custom_lists WHERE user_id = current_user_id;
  DELETE FROM tv_shows WHERE user_id = current_user_id;
  DELETE FROM movies WHERE user_id = current_user_id;
  DELETE FROM users WHERE id = current_user_id;
  
  -- Delete the auth user (this will invalidate the session)
  DELETE FROM auth.users WHERE id = current_user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_account() TO authenticated;
