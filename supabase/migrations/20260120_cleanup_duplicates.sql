-- Clean up duplicate movie records
-- This keeps only the most recent record for each (user_id, title, year) combination

-- First, create a temporary table with the IDs we want to keep
WITH ranked_movies AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, title, year 
      ORDER BY updated_at DESC
    ) as rn
  FROM movies
)
DELETE FROM movies
WHERE id IN (
  SELECT id FROM ranked_movies WHERE rn > 1
);

-- Clean up duplicate TV show records  
WITH ranked_shows AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, title, year 
      ORDER BY updated_at DESC
    ) as rn
  FROM tv_shows
)
DELETE FROM tv_shows
WHERE id IN (
  SELECT id FROM ranked_shows WHERE rn > 1
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE movies 
DROP CONSTRAINT IF EXISTS movies_user_title_year_unique;

ALTER TABLE movies
ADD CONSTRAINT movies_user_title_year_unique 
UNIQUE (user_id, title, year);

ALTER TABLE tv_shows
DROP CONSTRAINT IF EXISTS tv_shows_user_title_year_unique;

ALTER TABLE tv_shows
ADD CONSTRAINT tv_shows_user_title_year_unique 
UNIQUE (user_id, title, year);
