/*
  # Add watchlist feature

  1. Schema Changes
    - Add `is_watchlist` column to movies table
    - Add `is_watchlist` column to tv_shows table
    - Set default value to false
    - Add indexes for better performance

  2. Security
    - No RLS changes needed (existing policies cover new column)
*/

-- Add is_watchlist column to movies table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'movies' AND column_name = 'is_watchlist'
  ) THEN
    ALTER TABLE movies ADD COLUMN is_watchlist boolean DEFAULT false;
  END IF;
END $$;

-- Add is_watchlist column to tv_shows table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tv_shows' AND column_name = 'is_watchlist'
  ) THEN
    ALTER TABLE tv_shows ADD COLUMN is_watchlist boolean DEFAULT false;
  END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_movies_is_watchlist ON movies(is_watchlist);
CREATE INDEX IF NOT EXISTS idx_tv_shows_is_watchlist ON tv_shows(is_watchlist);