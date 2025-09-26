/*
  # Add watched_date column to movies table

  1. Changes
    - Add `watched_date` column to `movies` table
    - Column type: timestamp with time zone
    - Allow NULL values
    - Default value: NULL

  2. Notes
    - This column will track when a movie was marked as watched
    - Existing records will have NULL watched_date initially
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'movies' AND column_name = 'watched_date'
  ) THEN
    ALTER TABLE movies ADD COLUMN watched_date timestamptz DEFAULT NULL;
  END IF;
END $$;