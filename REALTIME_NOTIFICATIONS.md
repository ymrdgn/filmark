# 🔔 Real-Time Bildirimler Sistemi

## ✅ Yapılan İyileştirmeler

### 1. **Optimize Edilmiş Realtime Subscription**

- ✅ Kullanıcıya özel filtreli dinleme (`filter: user_id=eq.${currentUserId}`)
- ✅ INSERT, UPDATE, DELETE eventlerini ayrı ayrı dinleme
- ✅ Yeni bildirimler anında state'e ekleniyor (sayfa yenilemeye gerek yok)
- ✅ Bildirimin okundu işaretlenmesi anında UI'dan kaldırılıyor
- ✅ Silinen bildirimler anında UI'dan kaldırılıyor

### 2. **Real-Time Özellikler**

#### Arkadaşlık İsteği Gönderme

```typescript
// Kullanıcı A, Kullanıcı B'ye arkadaşlık isteği gönderir
await friendsApi.sendFriendRequest(friendId);

// Kullanıcı B'nin ekranında ANINDA bildirim görünür:
// 🔔 "user-a@example.com wants to add you as a friend"
```

#### Arkadaşlık İsteğini Kabul Etme

```typescript
// Kullanıcı B isteği kabul eder
await friendsApi.respondToRequest(friendshipId, 'accepted');

// İki şey olur:
// 1. Kullanıcı B'nin bildirim listesinden istek ANINDA kaybolur
// 2. Kullanıcı A'nın ekranına ANINDA kabul bildirimi gelir:
//    🔔 "user-b@example.com accepted your friend request"
```

#### Arkadaşlık İsteğini Reddetme/İptal Etme

```typescript
// Kullanıcı B isteği reddeder veya Kullanıcı A isteği iptal eder
await friendsApi.respondToRequest(friendshipId, 'rejected');
// veya
await friendsApi.removeFriend(friendshipId);

// Bildirim ANINDA UI'dan kaldırılır (her iki tarafta da)
```

### 3. **Teknik Detaylar**

#### NotificationBell Bileşeni Güncellemeleri

```typescript
// Kullanıcı kimliğini sakla
const [userId, setUserId] = useState<string | null>(null);

// Kullanıcıya özel subscription
const channel = supabase.channel(`notifications-${currentUserId}`).on(
  'postgres_changes',
  {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${currentUserId}`, // 👈 Kullanıcıya özel filtre
  },
  (payload) => {
    // Yeni bildirim geldi, anında ekle
    setNotifications((prev) => [payload.new, ...prev]);
    setUnreadCount((prev) => prev + 1);
  },
);
```

#### Database Trigger'lar

```sql
-- Arkadaşlık isteği gönderildiğinde
CREATE TRIGGER friend_request_notification_trigger
  AFTER INSERT ON friends
  FOR EACH ROW
  EXECUTE FUNCTION create_friend_request_notification();

-- İstek kabul edildiğinde
CREATE TRIGGER friend_accepted_notification_trigger
  AFTER UPDATE ON friends
  FOR EACH ROW
  EXECUTE FUNCTION create_friend_accepted_notification();

-- İstek silindiğinde (iptal/red)
CREATE TRIGGER friend_delete_notification_trigger
  BEFORE DELETE ON friends
  FOR EACH ROW
  EXECUTE FUNCTION delete_friend_notifications_on_delete();
```

## 🚀 Test Etme

### Adım 1: Realtime'ı Aktifleştir

```bash
# Supabase Dashboard'da şu SQL'i çalıştır:
cat ENABLE_REALTIME.sql
```

Veya manuel olarak:

1. Supabase Dashboard → Database → Replication
2. `notifications` tablosunu bul
3. "Realtime" toggle'ını aç

### Adım 2: İki Farklı Hesap Kullan

```bash
# Terminal 1: İlk kullanıcı
npx expo start

# Terminal 2: İkinci kullanıcı (başka bir cihaz/emulator)
npx expo start --android
# veya
npx expo start --ios
```

### Adım 3: Arkadaşlık İsteği Gönder

1. **Kullanıcı A** → Friends sekmesi → Search kullanıcı → Send friend request
2. **Kullanıcı B'nin ekranında** → Bildirim zili ANINDA kırmızı badge gösterir
3. **Kullanıcı B** → Bildirim ziline tıkla → İsteği gör
4. **Kullanıcı B** → Accept'e tıkla
5. **Kullanıcı A'nın ekranında** → Kabul bildirimi ANINDA görünür

### Adım 4: Console Loglarını İzle

```bash
# Realtime bağlantı durumunu görmek için:
# Metro bundler'da şu logları göreceksiniz:

🔔 Subscribing to real-time notifications for user: xxxx-xxxx-xxxx
🔔 Subscription status: SUBSCRIBED
🔔 New notification received: { id: 'xxx', type: 'friend_request', ... }
```

## 📊 Supabase Realtime Konfigürasyonu

### Kontrol Et

```sql
-- Realtime'ın aktif olduğunu doğrula
SELECT * FROM pg_publication_tables
WHERE tablename = 'notifications';

-- Beklenen sonuç:
-- schemaname | tablename      | pubname
-- -----------+----------------+------------------
-- public     | notifications  | supabase_realtime
```

### Realtime İzinleri

Notifications tablosunda RLS (Row Level Security) politikaları:

```sql
-- Kullanıcı sadece kendi bildirimlerini görebilir
CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Kullanıcı sadece kendi bildirimlerini güncelleyebilir
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
```

## 🎯 Özellikler

✅ **Anında bildirim** - Arkadaşlık isteği gönderildiğinde karşı taraf anında görür
✅ **Anında güncelleme** - Kabul/red işlemleri anında yansır
✅ **Otomatik temizlik** - Okunan/silinen bildirimler anında kaybolur
✅ **Performans optimizasyonu** - Sadece ilgili kullanıcının bildirimleri dinlenir
✅ **Güvenlik** - RLS ile sadece kendi bildirimlerinizi görebilirsiniz

## 🐛 Troubleshooting

### Bildirimler gelmiyor

1. `ENABLE_REALTIME.sql` dosyasını çalıştırdınız mı?
2. Supabase Dashboard'da Realtime açık mı?
3. Console'da "Subscription status: SUBSCRIBED" görüyor musunuz?

### Bildirimler gecikmeli geliyor

1. İnternet bağlantınızı kontrol edin
2. Supabase projenizin region'ını kontrol edin (yakın region daha hızlıdır)
3. Metro bundler'ı yeniden başlatın

### Bildirim geldi ama görünmüyor

1. Console'da "New notification received" logu var mı?
2. `user_id` doğru eşleşiyor mu?
3. `is_read: false` mi?

## 📝 Notlar

- Realtime subscription, component unmount olduğunda otomatik olarak temizlenir
- Her kullanıcı için unique channel oluşturulur (`notifications-${userId}`)
- INSERT, UPDATE, DELETE eventleri ayrı ayrı handle edilir
- State güncellemeleri immutable şekilde yapılır (React best practices)
