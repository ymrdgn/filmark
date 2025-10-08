/*
  # Privacy Settings

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
    - Add policy for users to read their own settings
    - Add policy for users to update their own settings
*/

CREATE TABLE IF NOT EXISTS user_privacy_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_visibility text NOT NULL DEFAULT 'public' CHECK (profile_visibility IN ('public', 'friends', 'private')),
  show_activity boolean NOT NULL DEFAULT true,
  allow_friend_requests boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_privacy_settings ENABLE ROW LEVEL SECURITY;

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

CREATE OR REPLACE FUNCTION create_default_privacy_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_privacy_settings (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_privacy'
  ) THEN
    CREATE TRIGGER on_auth_user_created_privacy
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION create_default_privacy_settings();
  END IF;
END $$;