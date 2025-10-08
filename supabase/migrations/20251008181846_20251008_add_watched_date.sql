/*
  # Add watched_date column

  1. Schema Changes
    - Add `watched_date` column to movies table
    - This will track when the movie was watched

  2. Security
    - No RLS changes needed (existing policies cover new column)
*/

-- Add watched_date column to movies table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'movies' AND column_name = 'watched_date'
  ) THEN
    ALTER TABLE movies ADD COLUMN watched_date timestamptz;
  END IF;
END $$;