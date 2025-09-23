/*
  # WatchTracker Database Schema

  1. New Tables
    - `movies`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `title` (text)
      - `year` (integer)
      - `duration` (integer, minutes)
      - `poster_url` (text, optional)
      - `status` (text: 'watched', 'watchlist')
      - `rating` (integer, 1-5, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `tv_shows`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `title` (text)
      - `year` (integer)
      - `seasons` (integer)
      - `episodes` (integer)
      - `poster_url` (text, optional)
      - `status` (text: 'watched', 'watching', 'watchlist')
      - `rating` (integer, 1-5, optional)
      - `current_season` (integer, optional)
      - `current_episode` (integer, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `custom_lists`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text)
      - `description` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `list_items`
      - `id` (uuid, primary key)
      - `list_id` (uuid, foreign key to custom_lists)
      - `movie_id` (uuid, foreign key to movies, optional)
      - `tv_show_id` (uuid, foreign key to tv_shows, optional)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create movies table
CREATE TABLE IF NOT EXISTS movies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  year integer,
  duration integer,
  poster_url text,
  status text CHECK (status IN ('watched', 'watchlist')) DEFAULT 'watchlist',
  rating integer CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tv_shows table
CREATE TABLE IF NOT EXISTS tv_shows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  year integer,
  seasons integer DEFAULT 1,
  episodes integer DEFAULT 1,
  poster_url text,
  status text CHECK (status IN ('watched', 'watching', 'watchlist')) DEFAULT 'watchlist',
  rating integer CHECK (rating >= 1 AND rating <= 5),
  current_season integer DEFAULT 1,
  current_episode integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create custom_lists table
CREATE TABLE IF NOT EXISTS custom_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create list_items table
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

-- Enable Row Level Security
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE tv_shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_items ENABLE ROW LEVEL SECURITY;

-- Movies policies
CREATE POLICY "Users can read own movies"
  ON movies
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own movies"
  ON movies
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own movies"
  ON movies
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own movies"
  ON movies
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- TV Shows policies
CREATE POLICY "Users can read own tv_shows"
  ON tv_shows
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tv_shows"
  ON tv_shows
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tv_shows"
  ON tv_shows
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tv_shows"
  ON tv_shows
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Custom Lists policies
CREATE POLICY "Users can read own custom_lists"
  ON custom_lists
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own custom_lists"
  ON custom_lists
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom_lists"
  ON custom_lists
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom_lists"
  ON custom_lists
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- List Items policies
CREATE POLICY "Users can read own list_items"
  ON list_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM custom_lists
      WHERE custom_lists.id = list_items.list_id
      AND custom_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own list_items"
  ON list_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM custom_lists
      WHERE custom_lists.id = list_items.list_id
      AND custom_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own list_items"
  ON list_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM custom_lists
      WHERE custom_lists.id = list_items.list_id
      AND custom_lists.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_movies_user_id ON movies(user_id);
CREATE INDEX IF NOT EXISTS idx_movies_status ON movies(status);
CREATE INDEX IF NOT EXISTS idx_tv_shows_user_id ON tv_shows(user_id);
CREATE INDEX IF NOT EXISTS idx_tv_shows_status ON tv_shows(status);
CREATE INDEX IF NOT EXISTS idx_custom_lists_user_id ON custom_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_list_items_list_id ON list_items(list_id);
CREATE INDEX IF NOT EXISTS idx_list_items_movie_id ON list_items(movie_id);
CREATE INDEX IF NOT EXISTS idx_list_items_tv_show_id ON list_items(tv_show_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_movies_updated_at
    BEFORE UPDATE ON movies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tv_shows_updated_at
    BEFORE UPDATE ON tv_shows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();