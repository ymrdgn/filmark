-- Fix get_friend_movies to prevent duplicate entries
-- This ensures only one record per movie title is returned (the most recent one)

DROP FUNCTION IF EXISTS get_friend_movies(uuid);

CREATE OR REPLACE FUNCTION get_friend_movies(friend_user_id uuid)
RETURNS TABLE(
  id uuid,
  title text,
  year text,
  poster_url text,
  is_watched boolean,
  is_favorite boolean,
  is_watchlist boolean,
  rating integer,
  created_at timestamptz,
  updated_at timestamptz,
  my_movie_id uuid,
  in_collection boolean
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
  SELECT DISTINCT ON (m.title, m.year)
    m.id,
    m.title,
    m.year::text,
    m.poster_url,
    m.is_watched,
    m.is_favorite,
    m.is_watchlist,
    m.rating,
    m.created_at,
    m.updated_at,
    my_m.id as my_movie_id,
    (my_m.id IS NOT NULL) as in_collection
  FROM movies m
  LEFT JOIN movies my_m ON my_m.user_id = auth.uid() 
    AND my_m.title = m.title 
    AND my_m.year = m.year
  WHERE m.user_id = friend_user_id
    AND m.is_watched = true
  ORDER BY m.title, m.year, m.updated_at DESC;
END;
$$;

-- Fix get_friend_tv_shows with the same approach
DROP FUNCTION IF EXISTS get_friend_tv_shows(uuid);

CREATE OR REPLACE FUNCTION get_friend_tv_shows(friend_user_id uuid)
RETURNS TABLE(
  id uuid,
  title text,
  year text,
  poster_url text,
  is_watched boolean,
  is_favorite boolean,
  is_watchlist boolean,
  rating integer,
  created_at timestamptz,
  updated_at timestamptz,
  my_show_id uuid,
  in_collection boolean
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
  SELECT DISTINCT ON (t.title, t.year)
    t.id,
    t.title,
    t.year::text,
    t.poster_url,
    t.is_watched,
    t.is_favorite,
    t.is_watchlist,
    t.rating,
    t.created_at,
    t.updated_at,
    my_t.id as my_show_id,
    (my_t.id IS NOT NULL) as in_collection
  FROM tv_shows t
  LEFT JOIN tv_shows my_t ON my_t.user_id = auth.uid() 
    AND my_t.title = t.title 
    AND my_t.year = t.year
  WHERE t.user_id = friend_user_id
    AND t.is_watched = true
  ORDER BY t.title, t.year, t.updated_at DESC;
END;
$$;
