/*
  # Allow users to view their friends' basic information

  1. Security Policy
    - Users can read their accepted friends' user data from public.users table
    - This allows fetching friend emails for display purposes

  2. Changes
    - Add RLS policy to users table allowing access to friends' data
*/

-- Add policy to allow users to read their friends' data
CREATE POLICY "Users can read friends data" ON public.users
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR -- Can always read own data
    EXISTS (
      SELECT 1 FROM public.friends
      WHERE 
        (friends.user_id = auth.uid() AND friends.friend_id = users.id) OR
        (friends.friend_id = auth.uid() AND friends.user_id = users.id)
      AND friends.status = 'accepted'
    )
  );