/*
  # Create achievements system

  1. New Tables
    - `achievements`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text)
      - `icon` (text)
      - `requirement_type` (text)
      - `requirement_value` (integer)
      - `created_at` (timestamp)
    - `user_achievements`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `achievement_id` (uuid, foreign key)
      - `earned_at` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users

  3. Initial Data
    - Insert default achievements
*/

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  requirement_type text NOT NULL,
  requirement_value integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Policies for achievements (everyone can read)
CREATE POLICY "Anyone can read achievements"
  ON achievements
  FOR SELECT
  TO authenticated
  USING (true);

-- Policies for user_achievements
CREATE POLICY "Users can read own achievements"
  ON user_achievements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON user_achievements
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Insert default achievements
INSERT INTO achievements (name, description, icon, requirement_type, requirement_value) VALUES
  ('Movie Buff', 'Watched 10+ movies', 'Award', 'movies_watched', 10),
  ('Cinema Master', 'Watched 50+ movies', 'Award', 'movies_watched', 50),
  ('Movie Legend', 'Watched 100+ movies', 'Award', 'movies_watched', 100),
  ('TV Enthusiast', 'Watched 10+ TV shows', 'Tv', 'tv_shows_watched', 10),
  ('Series Master', 'Watched 25+ TV shows', 'Tv', 'tv_shows_watched', 25),
  ('Binge King', 'Watched 50+ TV shows', 'Tv', 'tv_shows_watched', 50),
  ('Critic', 'Rated 10+ items', 'Star', 'items_rated', 10),
  ('Super Critic', 'Rated 25+ items', 'Star', 'items_rated', 25),
  ('Episode Hunter', 'Watched 100+ episodes', 'TrendingUp', 'episodes_watched', 100),
  ('Marathon Runner', 'Watched 500+ episodes', 'TrendingUp', 'episodes_watched', 500),
  ('First Steps', 'Added your first movie or TV show', 'Plus', 'items_added', 1),
  ('Collector', 'Added 25+ items to collection', 'Plus', 'items_added', 25)
ON CONFLICT (name) DO NOTHING;

-- Create function to check and award achievements
CREATE OR REPLACE FUNCTION check_and_award_achievements(user_uuid uuid)
RETURNS void AS $$
DECLARE
  achievement_record RECORD;
  movies_watched_count INTEGER;
  tv_shows_watched_count INTEGER;
  items_rated_count INTEGER;
  episodes_watched_count INTEGER;
  items_added_count INTEGER;
BEGIN
  -- Get user stats
  SELECT COUNT(*) INTO movies_watched_count
  FROM movies 
  WHERE user_id = user_uuid AND is_watched = true;
  
  SELECT COUNT(*) INTO tv_shows_watched_count
  FROM tv_shows 
  WHERE user_id = user_uuid AND is_watched = true;
  
  SELECT COUNT(*) INTO items_rated_count
  FROM (
    SELECT id FROM movies WHERE user_id = user_uuid AND rating > 0
    UNION ALL
    SELECT id FROM tv_shows WHERE user_id = user_uuid AND rating > 0
  ) rated_items;
  
  SELECT COALESCE(SUM(episodes), 0) INTO episodes_watched_count
  FROM tv_shows 
  WHERE user_id = user_uuid AND is_watched = true;
  
  SELECT COUNT(*) INTO items_added_count
  FROM (
    SELECT id FROM movies WHERE user_id = user_uuid
    UNION ALL
    SELECT id FROM tv_shows WHERE user_id = user_uuid
  ) all_items;
  
  -- Check each achievement
  FOR achievement_record IN 
    SELECT * FROM achievements
  LOOP
    -- Skip if user already has this achievement
    IF EXISTS (
      SELECT 1 FROM user_achievements 
      WHERE user_id = user_uuid AND achievement_id = achievement_record.id
    ) THEN
      CONTINUE;
    END IF;
    
    -- Check if user meets requirement
    CASE achievement_record.requirement_type
      WHEN 'movies_watched' THEN
        IF movies_watched_count >= achievement_record.requirement_value THEN
          INSERT INTO user_achievements (user_id, achievement_id)
          VALUES (user_uuid, achievement_record.id);
        END IF;
      WHEN 'tv_shows_watched' THEN
        IF tv_shows_watched_count >= achievement_record.requirement_value THEN
          INSERT INTO user_achievements (user_id, achievement_id)
          VALUES (user_uuid, achievement_record.id);
        END IF;
      WHEN 'items_rated' THEN
        IF items_rated_count >= achievement_record.requirement_value THEN
          INSERT INTO user_achievements (user_id, achievement_id)
          VALUES (user_uuid, achievement_record.id);
        END IF;
      WHEN 'episodes_watched' THEN
        IF episodes_watched_count >= achievement_record.requirement_value THEN
          INSERT INTO user_achievements (user_id, achievement_id)
          VALUES (user_uuid, achievement_record.id);
        END IF;
      WHEN 'items_added' THEN
        IF items_added_count >= achievement_record.requirement_value THEN
          INSERT INTO user_achievements (user_id, achievement_id)
          VALUES (user_uuid, achievement_record.id);
        END IF;
    END CASE;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to automatically check achievements
CREATE OR REPLACE FUNCTION trigger_check_achievements()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM check_and_award_achievements(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
DROP TRIGGER IF EXISTS movies_achievement_trigger ON movies;
CREATE TRIGGER movies_achievement_trigger
  AFTER INSERT OR UPDATE ON movies
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_achievements();

DROP TRIGGER IF EXISTS tv_shows_achievement_trigger ON tv_shows;
CREATE TRIGGER tv_shows_achievement_trigger
  AFTER INSERT OR UPDATE ON tv_shows
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_achievements();