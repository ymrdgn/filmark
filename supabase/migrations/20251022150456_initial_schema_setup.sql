/*
  # WatchTracker Complete Database Schema

  1. New Tables
    - movies: User's movie collection
    - tv_shows: User's TV show collection
    - custom_lists: User-created lists
    - list_items: Items in custom lists
    - users: User profiles
    - friends: Friend relationships
    - notifications: User notifications
    - achievements: Achievement definitions
    - user_achievements: User's earned achievements

  2. Security
    - Enable RLS on all tables
    - Policies for authenticated users
*/

-- Movies table
CREATE TABLE IF NOT EXISTS movies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  year integer,
  duration integer,
  poster_url text,
  is_watched boolean DEFAULT false,
  is_favorite boolean DEFAULT false,
  is_watchlist boolean DEFAULT false,
  rating integer CHECK (rating >= 1 AND rating <= 10),
  watched_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- TV Shows table
CREATE TABLE IF NOT EXISTS tv_shows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  year integer,
  seasons integer DEFAULT 1,
  episodes integer DEFAULT 1,
  poster_url text,
  is_watched boolean DEFAULT false,
  is_favorite boolean DEFAULT false,
  is_watchlist boolean DEFAULT false,
  rating integer CHECK (rating >= 1 AND rating <= 10),
  watched_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Custom Lists table
CREATE TABLE IF NOT EXISTS custom_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- List Items table
CREATE TABLE IF NOT EXISTS list_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid REFERENCES custom_lists(id) ON DELETE CASCADE NOT NULL,
  movie_id uuid REFERENCES movies(id) ON DELETE CASCADE,
  tv_show_id uuid REFERENCES tv_shows(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT check_item_type CHECK (
    (movie_id IS NOT NULL AND tv_show_id IS NULL) OR
    (movie_id IS NULL AND tv_show_id IS NOT NULL)
  )
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  avatar_url text,
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Friends table
CREATE TABLE IF NOT EXISTS friends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  friend_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status text CHECK (status IN ('pending', 'accepted')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  category text NOT NULL,
  requirement_type text NOT NULL,
  requirement_value integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- User Achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id uuid REFERENCES achievements(id) ON DELETE CASCADE NOT NULL,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE tv_shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Movies policies
CREATE POLICY "Users can read own movies" ON movies FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own movies" ON movies FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own movies" ON movies FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own movies" ON movies FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- TV Shows policies
CREATE POLICY "Users can read own tv_shows" ON tv_shows FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tv_shows" ON tv_shows FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tv_shows" ON tv_shows FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own tv_shows" ON tv_shows FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Custom Lists policies
CREATE POLICY "Users can read own lists" ON custom_lists FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own lists" ON custom_lists FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own lists" ON custom_lists FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own lists" ON custom_lists FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- List Items policies
CREATE POLICY "Users can read own list_items" ON list_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM custom_lists WHERE custom_lists.id = list_items.list_id AND custom_lists.user_id = auth.uid()));
CREATE POLICY "Users can insert own list_items" ON list_items FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM custom_lists WHERE custom_lists.id = list_items.list_id AND custom_lists.user_id = auth.uid()));
CREATE POLICY "Users can delete own list_items" ON list_items FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM custom_lists WHERE custom_lists.id = list_items.list_id AND custom_lists.user_id = auth.uid()));

-- Users policies
CREATE POLICY "Users can read all profiles" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Friends policies
CREATE POLICY "Users can read own friends" ON friends FOR SELECT TO authenticated USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can create friend requests" ON friends FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update friend status" ON friends FOR UPDATE TO authenticated USING (auth.uid() = friend_id) WITH CHECK (auth.uid() = friend_id);
CREATE POLICY "Users can delete friendships" ON friends FOR DELETE TO authenticated USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Notifications policies
CREATE POLICY "Users can read own notifications" ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Achievements policies
CREATE POLICY "Anyone can read achievements" ON achievements FOR SELECT TO authenticated USING (true);

-- User Achievements policies
CREATE POLICY "Users can read own achievements" ON user_achievements FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_movies_user_id ON movies(user_id);
CREATE INDEX IF NOT EXISTS idx_tv_shows_user_id ON tv_shows(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_lists_user_id ON custom_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_list_items_list_id ON list_items(list_id);
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);

-- Functions
CREATE OR REPLACE FUNCTION check_and_award_achievements(user_uuid uuid)
RETURNS void AS $$
DECLARE
  achievement_rec RECORD;
  current_count INTEGER;
BEGIN
  FOR achievement_rec IN 
    SELECT * FROM achievements 
    WHERE id NOT IN (
      SELECT achievement_id FROM user_achievements WHERE user_id = user_uuid
    )
  LOOP
    IF achievement_rec.requirement_type = 'movies_watched' THEN
      SELECT COUNT(*) INTO current_count FROM movies WHERE user_id = user_uuid AND is_watched = true;
    ELSIF achievement_rec.requirement_type = 'tv_shows_watched' THEN
      SELECT COUNT(*) INTO current_count FROM tv_shows WHERE user_id = user_uuid AND is_watched = true;
    ELSIF achievement_rec.requirement_type = 'favorites' THEN
      SELECT COUNT(*) INTO current_count FROM (
        SELECT id FROM movies WHERE user_id = user_uuid AND is_favorite = true
        UNION ALL
        SELECT id FROM tv_shows WHERE user_id = user_uuid AND is_favorite = true
      ) AS favorites;
    ELSIF achievement_rec.requirement_type = 'custom_lists' THEN
      SELECT COUNT(*) INTO current_count FROM custom_lists WHERE user_id = user_uuid;
    ELSE
      CONTINUE;
    END IF;

    IF current_count >= achievement_rec.requirement_value THEN
      INSERT INTO user_achievements (user_id, achievement_id) VALUES (user_uuid, achievement_rec.id);
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_movies_updated_at BEFORE UPDATE ON movies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tv_shows_updated_at BEFORE UPDATE ON tv_shows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_custom_lists_updated_at BEFORE UPDATE ON custom_lists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
