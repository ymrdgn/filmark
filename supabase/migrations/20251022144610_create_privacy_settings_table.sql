/*
  # Create Privacy Settings Table

  1. New Tables
    - `user_privacy_settings`
      - `user_id` (uuid, primary key, references auth.users)
      - `profile_visibility` (text) - 'public', 'friends', 'private'
      - `show_activity` (boolean) - Show watch activity to others
      - `allow_friend_requests` (boolean) - Allow others to send friend requests
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `user_privacy_settings` table
    - Add policies for users to manage their own settings
    
  3. Triggers
    - Auto-create default privacy settings when user signs up
*/

-- Create the table
CREATE TABLE IF NOT EXISTS user_privacy_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_visibility text NOT NULL DEFAULT 'public' CHECK (profile_visibility IN ('public', 'friends', 'private')),
  show_activity boolean NOT NULL DEFAULT true,
  allow_friend_requests boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_privacy_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own privacy settings" ON user_privacy_settings;
DROP POLICY IF EXISTS "Users can insert own privacy settings" ON user_privacy_settings;
DROP POLICY IF EXISTS "Users can update own privacy settings" ON user_privacy_settings;

-- Create policies
CREATE POLICY "Users can read own privacy settings"
  ON user_privacy_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own privacy settings"
  ON user_privacy_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own privacy settings"
  ON user_privacy_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create trigger function
CREATE OR REPLACE FUNCTION create_default_privacy_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_privacy_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created_privacy ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created_privacy
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_privacy_settings();

-- Create settings for existing users
INSERT INTO user_privacy_settings (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
