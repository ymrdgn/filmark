/*
  # Friends System Migration

  1. New Tables
    - `friends`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `friend_id` (uuid, references auth.users)
      - `status` (text, enum: pending/accepted/blocked)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `friends` table
    - Add policies for users to manage their own friendships

  3. Functions
    - `search_users_by_email` - Search users by email
    - `get_friend_movies` - Get friend's movies
    - `get_friend_tv_shows` - Get friend's TV shows
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

-- Create policies
CREATE POLICY "Users can manage their own friendships"
  ON friends
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id)
  WITH CHECK (auth.uid() = user_id OR auth.uid() = friend_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_friends_status ON friends(status);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_friends_updated_at'
  ) THEN
    CREATE TRIGGER update_friends_updated_at
      BEFORE UPDATE ON friends
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Function to search users by email
CREATE OR REPLACE FUNCTION search_users_by_email(search_email text)
RETURNS TABLE(id uuid, email text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.email
  FROM users u
  WHERE u.email ILIKE '%' || search_email || '%'
    AND u.id != auth.uid()
    AND u.id NOT IN (
      SELECT CASE 
        WHEN f.user_id = auth.uid() THEN f.friend_id
        ELSE f.user_id
      END
      FROM friends f
      WHERE f.user_id = auth.uid() OR f.friend_id = auth.uid()
    )
  LIMIT 10;
END;
$$;

-- Function to get friend's movies
CREATE OR REPLACE FUNCTION get_friend_movies(friend_user_id uuid)
RETURNS TABLE(
  id uuid,
  title text,
  year integer,
  poster_url text,
  is_watched boolean,
  is_favorite boolean,
  rating integer
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if users are friends
  IF NOT EXISTS (
    SELECT 1 FROM friends f
    WHERE ((f.user_id = auth.uid() AND f.friend_id = friend_user_id) 
           OR (f.user_id = friend_user_id AND f.friend_id = auth.uid()))
      AND f.status = 'accepted'
  ) THEN
    RAISE EXCEPTION 'Not authorized to view this user''s movies';
  END IF;

  RETURN QUERY
  SELECT   
    m.id,
    m.title,
    m.year,
    m.poster_url,
    m.is_watched,
    m.is_favorite,
    m.is_watchlist,
    m.rating,
    m.created_at,
    m.updated_at
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
  seasons integer,
  episodes integer,
  poster_url text,
  is_watched boolean,
  is_favorite boolean,
  rating integer,
  current_season integer,
  current_episode integer,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if users are friends
  IF NOT EXISTS (
    SELECT 1 FROM friends f
    WHERE ((f.user_id = auth.uid() AND f.friend_id = friend_user_id) 
           OR (f.user_id = friend_user_id AND f.friend_id = auth.uid()))
      AND f.status = 'accepted'
  ) THEN
    RAISE EXCEPTION 'Not authorized to view this user''s TV shows';
  END IF;

  RETURN QUERY
  SELECT
    t.id,
    t.title,
    t.year,
    t.seasons,
    t.episodes,
    t.poster_url,
    t.is_watched,
    t.is_favorite,
    t.is_watchlist,
    t.rating,
    t.current_season,
    t.current_episode,
    t.created_at,
    t.updated_at
  FROM tv_shows t
  WHERE t.user_id = friend_user_id
  ORDER BY t.created_at DESC;
END;
$$;