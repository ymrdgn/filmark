-- ==========================================
-- SUPABASE REALTIME ÖZELLİĞİNİ AKTİFLEŞTİR
-- Bu SQL'i Supabase Dashboard'da çalıştırın
-- ==========================================

-- 1. Notifications tablosu için Realtime'ı aktifleştir
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 2. Realtime'ın aktif olup olmadığını kontrol et
SELECT 
  schemaname,
  tablename,
  pubname
FROM 
  pg_publication_tables
WHERE 
  tablename = 'notifications';

-- Eğer yukarıdaki sorgu boş dönerse, realtime aktif değil demektir.
-- Eğer 'supabase_realtime' pubname'i görüyorsanız, realtime aktiftir.

-- ==========================================
-- NOT: Supabase Dashboard'da da kontrol edebilirsiniz:
-- Database > Replication > Notifications tablosu 
-- "Realtime" toggle'ını açık olduğundan emin olun
-- ==========================================
