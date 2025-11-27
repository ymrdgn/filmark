-- ==========================================
-- ARKADAŞLIK KABUL BİLDİRİMİ
-- Bu SQL'i Supabase Dashboard'da çalıştırın
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
