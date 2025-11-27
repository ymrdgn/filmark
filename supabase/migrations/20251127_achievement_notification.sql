-- ==========================================
-- ACHIEVEMENT KAZANILDIĞINDA BİLDİRİM GÖNDER
-- Bu SQL'i Supabase Dashboard'da çalıştırın
-- ==========================================

-- 1. Achievement kazanıldığında bildirim oluşturan fonksiyon
CREATE OR REPLACE FUNCTION create_achievement_earned_notification()
RETURNS TRIGGER AS $$
DECLARE
  achievement_name text;
  achievement_desc text;
BEGIN
  -- Achievement bilgilerini al
  SELECT name, description INTO achievement_name, achievement_desc
  FROM achievements
  WHERE id = NEW.achievement_id;

  -- Kullanıcıya bildirim oluştur
  INSERT INTO notifications (
    user_id,
    type,
    related_user_id,
    related_id,
    title,
    message,
    is_read
  ) VALUES (
    NEW.user_id,
    'achievement_earned',
    NEW.user_id,
    NEW.achievement_id,
    'Achievement Unlocked! 🏆',
    'You earned: ' || achievement_name,
    false
  );
  
  RAISE LOG 'Achievement notification created for user % - Achievement: %', NEW.user_id, achievement_name;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Eski trigger varsa sil
DROP TRIGGER IF EXISTS achievement_earned_notification_trigger ON user_achievements;

-- 3. Yeni trigger'ı oluştur
CREATE TRIGGER achievement_earned_notification_trigger
  AFTER INSERT ON user_achievements
  FOR EACH ROW
  EXECUTE FUNCTION create_achievement_earned_notification();

-- Test için: Achievements bildirimlerini kontrol et
-- SELECT * FROM notifications WHERE type = 'achievement_earned' ORDER BY created_at DESC LIMIT 5;
