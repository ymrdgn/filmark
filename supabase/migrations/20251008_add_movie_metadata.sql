/*
  # Add Movie Metadata Fields

  1. Changes
    - Add `director` column to store movie director name
    - Add `genre` column to store movie genres
    - Add `imdb_rating` column to store IMDB rating
    - Add `tmdb_id` column to store TMDB movie ID for API lookups
    - Add `imdb_id` column to store IMDB ID for linking to IMDB website

  2. Notes
    - All fields are optional (nullable) since existing movies may not have these details
    - tmdb_id is stored as integer to match TMDB API format
    - imdb_id is stored as text (format: tt1234567)
    - imdb_rating is stored as numeric for decimal values (e.g., 7.5)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'movies' AND column_name = 'director'
  ) THEN
    ALTER TABLE movies ADD COLUMN director text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'movies' AND column_name = 'genre'
  ) THEN
    ALTER TABLE movies ADD COLUMN genre text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'movies' AND column_name = 'imdb_rating'
  ) THEN
    ALTER TABLE movies ADD COLUMN imdb_rating numeric(3,1);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'movies' AND column_name = 'tmdb_id'
  ) THEN
    ALTER TABLE movies ADD COLUMN tmdb_id integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'movies' AND column_name = 'imdb_id'
  ) THEN
    ALTER TABLE movies ADD COLUMN imdb_id text;
  END IF;
END $$;
