/*
  # Add favorites system to movies and tv_shows

  1. Changes to movies table
    - Remove status column (watchlist/watched)
    - Add is_watched boolean column
    - Add is_favorite boolean column
    - Update constraints

  2. Changes to tv_shows table
    - Remove status column (watchlist/watching/watched)
    - Add is_watched boolean column
    - Add is_favorite boolean column
    - Update constraints

  3. Security
    - All existing RLS policies remain the same
*/

-- Update movies table
DO $$
BEGIN
  -- Add new columns if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'movies' AND column_name = 'is_watched'
  ) THEN
    ALTER TABLE movies ADD COLUMN is_watched boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'movies' AND column_name = 'is_favorite'
  ) THEN
    ALTER TABLE movies ADD COLUMN is_favorite boolean DEFAULT false;
  END IF;
END $$;

-- Migrate existing data for movies
UPDATE movies 
SET is_watched = (status = 'watched')
WHERE status IS NOT NULL;

-- Drop old constraint and column for movies
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'movies' AND constraint_name = 'movies_status_check'
  ) THEN
    ALTER TABLE movies DROP CONSTRAINT movies_status_check;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'movies' AND column_name = 'status'
  ) THEN
    ALTER TABLE movies DROP COLUMN status;
  END IF;
END $$;

-- Update tv_shows table
DO $$
BEGIN
  -- Add new columns if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tv_shows' AND column_name = 'is_watched'
  ) THEN
    ALTER TABLE tv_shows ADD COLUMN is_watched boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tv_shows' AND column_name = 'is_favorite'
  ) THEN
    ALTER TABLE tv_shows ADD COLUMN is_favorite boolean DEFAULT false;
  END IF;
END $$;

-- Migrate existing data for tv_shows
UPDATE tv_shows 
SET is_watched = (status IN ('watched', 'watching'))
WHERE status IS NOT NULL;

-- Drop old constraint and column for tv_shows
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'tv_shows' AND constraint_name = 'tv_shows_status_check'
  ) THEN
    ALTER TABLE tv_shows DROP CONSTRAINT tv_shows_status_check;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tv_shows' AND column_name = 'status'
  ) THEN
    ALTER TABLE tv_shows DROP COLUMN status;
  END IF;
END $$;