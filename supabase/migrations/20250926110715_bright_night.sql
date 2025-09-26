/*
  # Add Friends System

  1. New Tables
    - `friends`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `friend_id` (uuid, foreign key to auth.users)
      - `status` (text: 'pending', 'accepted', 'blocked')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `friends` table
    - Add policies for users to manage their own friend relationships
    - Add policies to view accepted friends' data

  3. Functions
    - Function to search users by email
    - Function to get mutual friends
*/

-- Create friends table
CREATE TABLE IF NOT EXISTS friends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Enable RLS
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_friends_status ON friends(status);

-- Add updated_at trigger
CREATE TRIGGER IF NOT EXISTS update_friends_updated_at
  BEFORE UPDATE ON friends
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
CREATE POLICY "Users can manage their own friend requests"
  ON friends
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id)
  WITH CHECK (auth.uid() = user_id OR auth.uid() = friend_id);

-- Function to search users by email (only returns basic info)
CREATE OR REPLACE FUNCTION search_users_by_email(search_email text)
RETURNS TABLE(id uuid, email text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.email
  FROM auth.users u
  WHERE u.email ILIKE '%' || search_email || '%'
    AND u.id != auth.uid()
  LIMIT 10;
END;
$$;

-- Function to get friend's movies (only if they are accepted friends)
CREATE OR REPLACE FUNCTION get_friend_movies(friend_user_id uuid)
RETURNS TABLE(
  id uuid,
  title text,
  year integer,
  poster_url text,
  is_watched boolean,
  is_favorite boolean,
  rating integer,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if users are friends
  IF NOT EXISTS (
    SELECT 1 FROM friends 
    WHERE ((user_id = auth.uid() AND friend_id = friend_user_id) 
           OR (user_id = friend_user_id AND friend_id = auth.uid()))
      AND status = 'accepted'
  ) THEN
    RAISE EXCEPTION 'Not authorized to view this user''s movies';
  END IF;

  RETURN QUERY
  SELECT m.id, m.title, m.year, m.poster_url, m.is_watched, m.is_favorite, m.rating, m.created_at
  FROM movies m
  WHERE m.user_id = friend_user_id
  ORDER BY m.created_at DESC;
END;
$$;

-- Function to get friend's TV shows
CREATE OR REPLACE FUNCTION get_friend_tv_shows(friend_user_id uuid)
RETURNS TABLE(
  id uuid,
  title text,
  year integer,
  poster_url text,
  is_watched boolean,
  is_favorite boolean,
  rating integer,
  seasons integer,
  episodes integer,
  current_season integer,
  current_episode integer,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if users are friends
  IF NOT EXISTS (
    SELECT 1 FROM friends 
    WHERE ((user_id = auth.uid() AND friend_id = friend_user_id) 
           OR (user_id = friend_user_id AND friend_id = auth.uid()))
      AND status = 'accepted'
  ) THEN
    RAISE EXCEPTION 'Not authorized to view this user''s TV shows';
  END IF;

  RETURN QUERY
  SELECT t.id, t.title, t.year, t.poster_url, t.is_watched, t.is_favorite, t.rating, 
         t.seasons, t.episodes, t.current_season, t.current_episode, t.created_at
  FROM tv_shows t
  WHERE t.user_id = friend_user_id
  ORDER BY t.created_at DESC;
END;
$$;