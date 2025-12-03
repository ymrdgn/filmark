-- ==========================================
-- ARKADAŞ FİLMLERİNDE KENDİ DURUMUNU GÖSTER
-- Bu SQL'i Supabase Dashboard'da çalıştırın
-- ==========================================

-- Önce eski fonksiyonları sil
DROP FUNCTION IF EXISTS get_friend_movies(uuid);
DROP FUNCTION IF EXISTS get_friend_tv_shows(uuid);

-- Arkadaşın filmlerini getirirken, aynı title+year'a sahip SENİN filmini de kontrol et
CREATE OR REPLACE FUNCTION get_friend_movies(friend_user_id uuid)
RETURNS TABLE(
  id uuid,
  title text,
  year integer,
  poster_url text,
  is_watched boolean,
  is_favorite boolean,
  is_watchlist boolean,
  rating integer,
  my_movie_id uuid,
  inCollection boolean
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
  SELECT 
    friend_movie.id,
    friend_movie.title,
    friend_movie.year::integer,
    friend_movie.poster_url,
    COALESCE(my_movie.is_watched, false) as is_watched,
    COALESCE(my_movie.is_favorite, false) as is_favorite,
    COALESCE(my_movie.is_watchlist, false) as is_watchlist,
    my_movie.rating::integer,
    my_movie.id as my_movie_id,
    (my_movie.id IS NOT NULL) as inCollection
  FROM movies friend_movie
  LEFT JOIN movies my_movie 
    ON my_movie.user_id = auth.uid() 
    AND my_movie.title = friend_movie.title 
    AND my_movie.year = friend_movie.year
  WHERE friend_movie.user_id = friend_user_id
  ORDER BY friend_movie.created_at DESC;
END;
$$;

-- Aynı mantığı TV shows için de uygula
CREATE OR REPLACE FUNCTION get_friend_tv_shows(friend_user_id uuid)
RETURNS TABLE(
  id uuid,
  title text,
  year integer,
  poster_url text,
  is_watched boolean,
  is_favorite boolean,
  is_watchlist boolean,
  rating integer,
  my_show_id uuid,
  inCollection boolean
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
  SELECT 
    friend_show.id,
    friend_show.title,
    friend_show.year::integer,
    friend_show.poster_url,
    COALESCE(my_show.is_watched, false) as is_watched,
    COALESCE(my_show.is_favorite, false) as is_favorite,
    COALESCE(my_show.is_watchlist, false) as is_watchlist,
    my_show.rating::integer,
    my_show.id as my_show_id,
    (my_show.id IS NOT NULL) as inCollection
  FROM tv_shows friend_show
  LEFT JOIN tv_shows my_show 
    ON my_show.user_id = auth.uid() 
    AND my_show.title = friend_show.title 
    AND my_show.year = friend_show.year
  WHERE friend_show.user_id = friend_user_id
  ORDER BY friend_show.created_at DESC;
END;
$$;

-- ==========================================
-- ARKADAŞLIK KABUL BİLDİRİMİ
-- ==========================================

-- 1. Trigger fonksiyonunu oluştur
CREATE OR REPLACE FUNCTION create_friend_accepted_notification()
RETURNS TRIGGER AS $$
DECLARE
  accepter_email text;
BEGIN
  -- Sadece pending'den accepted'a geçişte bildirim oluştur
  IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    -- Kabul eden kişinin emailini al
    SELECT email INTO accepter_email
    FROM auth.users
    WHERE id = NEW.friend_id;

    -- İsteği gönderen kişiye (user_id) bildirim oluştur
    INSERT INTO notifications (
      user_id,
      type,
      related_user_id,
      related_id,
      title,
      message,
      is_read
    ) VALUES (
      NEW.user_id,                    -- İsteği gönderen kişi
      'friend_request_accepted',      -- Bildirim tipi
      NEW.friend_id,                  -- Kabul eden kişi
      NEW.id,                         -- Arkadaşlık ID'si
      'Friend Request Accepted',      -- Başlık
      accepter_email || ' accepted your friend request',  -- Mesaj
      false                           -- Okunmamış
    );
    
    RAISE LOG 'Friend accepted notification created for user % by %', NEW.user_id, accepter_email;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Eski trigger varsa sil
DROP TRIGGER IF EXISTS friend_accepted_notification_trigger ON friends;

-- 3. Yeni trigger'ı oluştur
CREATE TRIGGER friend_accepted_notification_trigger
  AFTER UPDATE ON friends
  FOR EACH ROW
  EXECUTE FUNCTION create_friend_accepted_notification();

-- Test için: Notifications tablosunu kontrol et
-- SELECT * FROM notifications WHERE type = 'friend_request_accepted' ORDER BY created_at DESC LIMIT 5;
