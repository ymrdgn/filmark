/*
  # Add username to public users table

  1. Changes
    - Add username column to public.users table
    - Create function to sync username from auth metadata
    - Create trigger to automatically sync on user creation/update

  2. Security
    - Users can read and update their own username
    - Username is synced from auth.users metadata
*/

-- Add username column to public users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS username text;

-- Create function to sync username from auth metadata
CREATE OR REPLACE FUNCTION sync_username_from_auth()
RETURNS trigger AS $$
BEGIN
  -- Update username from auth metadata
  UPDATE public.users 
  SET username = NEW.raw_user_meta_data->>'username'
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync username on auth user changes
DROP TRIGGER IF EXISTS sync_username_trigger ON auth.users;
CREATE TRIGGER sync_username_trigger
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_username_from_auth();

-- Sync existing usernames
UPDATE public.users 
SET username = auth_users.raw_user_meta_data->>'username'
FROM auth.users auth_users
WHERE public.users.id = auth_users.id
AND auth_users.raw_user_meta_data->>'username' IS NOT NULL;

-- Update RLS policy to allow username updates
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);