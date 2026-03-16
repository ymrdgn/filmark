# 🧪 Emülatör'de Version Control Test - Adım Adım

## ✅ ÖN HAZIRLIK

### 1. Migration'ı Supabase'e Gönderin

```bash
supabase db push
```

veya manuel olarak Supabase Dashboard > SQL Editor'e gidin ve şunu çalıştırın:

```sql
-- app_version tablosunu oluştur
CREATE TABLE IF NOT EXISTS app_version (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
    minimum_version TEXT NOT NULL,
    current_version TEXT NOT NULL,
    force_update BOOLEAN DEFAULT false,
    update_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS app_version_platform_idx ON app_version(platform);

ALTER TABLE app_version ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read app version" ON app_version
    FOR SELECT
    USING (true);

-- Initial data
INSERT INTO app_version (platform, minimum_version, current_version, force_update, update_message)
VALUES
    ('ios', '1.0.26', '1.0.26', false, 'Yeni özellikler ve iyileştirmeler mevcut. Lütfen uygulamayı güncelleyin.'),
    ('android', '1.0.26', '1.0.26', false, 'Yeni özellikler ve iyileştirmeler mevcut. Lütfen uygulamayı güncelleyin.')
ON CONFLICT (platform) DO NOTHING;
```

### 2. Tablo Oluşturulduğunu Doğrulayın

Supabase Dashboard > SQL Editor:

```sql
SELECT * FROM app_version;
```

Çıktı:

```
platform | minimum_version | current_version | force_update
---------|-----------------|-----------------|-------------
ios      | 1.0.26          | 1.0.26          | false
android  | 1.0.26          | 1.0.26          | false
```

## 📱 EMÜLATÖRDEa ADIM ADIM TEST

### TEST 1: POPUP GÖSTERME (Soft Update)

**Adım 1:** Emülatörde uygulamayı başlatın

```bash
cd ~/Desktop/Apps/filmark
npm run dev

# Terminal'de bekleyin, sonra:
# iOS için: i
# Android için: a
```

**Adım 2:** Uygulama normal açılacak (popup yok çünkü versiyon güncel)

**Adım 3:** Supabase'de versiyonu yükseltin

Supabase Dashboard > SQL Editor:

```sql
-- iOS test ediyorsanız
UPDATE app_version
SET
    minimum_version = '1.0.30',
    current_version = '1.0.30',
    force_update = false,
    update_message = '🎉 Heyecan verici yeni özellikler eklendi! Şimdi güncelleyin.'
WHERE platform = 'ios';

-- Android test ediyorsanız
UPDATE app_version
SET
    minimum_version = '1.0.30',
    current_version = '1.0.30',
    force_update = false,
    update_message = '🎉 Heyecan verici yeni özellikler eklendi! Şimdi güncelleyin.'
WHERE platform = 'android';
```

**Adım 4:** Emülatörde uygulamayı yeniden başlatın

- Uygulamayı kapatın (swipe up / back button)
- Tekrar açın

**✅ BEKLENEN SONUÇ:**

- Uygulama açılır açılmaz **mat bir overlay** ile popup görünmeli
- Popup içinde yazmalı: "Güncelleme Mevcut"
- Mesaj: "🎉 Heyecan verici yeni özellikler eklendi! Şimdi güncelleyin."
- İki buton olmalı:
  - 🔵 **"Şimdi Güncelle"** (mavi, büyük)
  - 🔵 **"Daha Sonra"** (text butonu, altta)

**Adım 5:** "Daha Sonra" butonunu test edin

- "Daha Sonra"a tıklayın
- Popup kapanmalı
- Uygulama normal çalışmalı

**Adım 6:** AsyncStorage testini yapın

- Uygulamayı tamamen kapatın
- Tekrar açın
- **✅ BEKLENEN:** Popup bir daha AÇILMAMALI (AsyncStorage'da kaydedildi)

**Adım 7:** Yeni versiyon için tekrar popup gösterme
Supabase'de versiyonu daha da yükseltin:

```sql
UPDATE app_version
SET minimum_version = '1.0.35'
WHERE platform = 'ios'; -- veya 'android'
```

Uygulamayı tekrar açın:

- **✅ BEKLENEN:** Popup TEKRAR görünmeli (yeni versiyon için)

---

### TEST 2: ZORUNLU GÜNCELLEME (Force Update)

**Adım 1:** Supabase'de force_update'i aktif edin

```sql
UPDATE app_version
SET
    minimum_version = '2.0.0',
    force_update = true,
    update_message = '⚠️ Kritik güvenlik güncellemesi! Devam etmek için güncelleme yapmalısınız.'
WHERE platform = 'ios'; -- veya 'android'
```

**Adım 2:** Uygulamayı kapatıp açın

**✅ BEKLENEN SONUÇ:**

- Popup görünmeli
- Sadece **"Şimdi Güncelle"** butonu olmalı
- **"Daha Sonra" butonu OLMAMALI**
- Popup kapatılamaz (dışına tıklayınca kapanmamalı)

---

### TEST 3: MARKET YÖNLENDİRME

**iOS Test:**

**Adım 1:** iOS emülatörde popup açıkken "Şimdi Güncelle"e tıklayın

**✅ BEKLENEN SONUÇ:**

- iOS Simülatörde Safari açılmaya çalışır
- Eğer URL doğruysa App Store sayfası açılır
- **NOT:** iOS simulator'da bazen "Cannot connect to iTunes Store" hatası verilebilir - bu normal, gerçek cihazda çalışır

**Android Test:**

**Adım 1:** Android emülatörde popup açıkken "Şimdi Güncelle"e tıklayın

**✅ BEKLENEN SONUÇ:**

- Play Store açılmalı
- Uygulamanın sayfasına gitmeye çalışmalı

**FİKSİR: Emülatörde tam test için:**

Gerçek URL'leri test etmek istiyorsanız, geçici olarak test URL'leri kullanabilirsiniz:

`components/UpdateModal.tsx` dosyasını geçici olarak değiştirin:

```typescript
const APP_STORE_URL = 'https://www.apple.com'; // Test için
const PLAY_STORE_URL = 'https://www.google.com'; // Test için
```

Böylece emülatörde link açılmasını test edebilirsiniz.

---

### TEST 4: PLATFORM AYIRIMI

**Adım 1:** Supabase'de farklı versiyonlar ayarlayın

```sql
-- iOS için yüksek versiyon (popup görmeli)
UPDATE app_version
SET minimum_version = '5.0.0'
WHERE platform = 'ios';

-- Android için düşük versiyon (popup görmemeli)
UPDATE app_version
SET minimum_version = '1.0.0'
WHERE platform = 'android';
```

**Adım 2:** iOS emülatörde test edin

- **✅ BEKLENEN:** Popup görünmeli

**Adım 3:** Android emülatörde test edin

- **✅ BEKLENEN:** Popup görünmemeli

---

## 🐛 DEBUG - Sorun Çözümleme

### Popup Hiç Görünmüyor?

**1. Console logları ekleyin:**

`hooks/useVersionCheck.ts` dosyasına debug logları ekleyin:

```typescript
const checkVersion = async () => {
  try {
    const currentVersion = Constants.expoConfig?.version || '1.0.0';
    const platform = Platform.OS;

    console.log('🔍 Version Check Started');
    console.log('📱 Platform:', platform);
    console.log('📦 Current App Version:', currentVersion);

    const { data, error } = await supabase
      .from('app_version')
      .select('*')
      .eq('platform', platform)
      .single();

    console.log('🗄️ Supabase Response:', data);
    console.log('❌ Supabase Error:', error);

    if (error || !data) {
      console.log('⚠️ No version data found');
      return;
    }

    const versionInfo = data as VersionInfo;
    console.log('🎯 Minimum Required:', versionInfo.minimum_version);
    console.log('🆚 Current Version:', currentVersion);

    const comparison = compareVersions(
      currentVersion,
      versionInfo.minimum_version,
    );
    console.log('📊 Comparison Result:', comparison);
    console.log('🚀 Should Show Update:', comparison < 0);

    if (comparison < 0) {
      console.log('✅ SHOWING UPDATE MODAL');
      setUpdateMessage(versionInfo.update_message || 'Please update');
      setForceUpdate(versionInfo.force_update);
      setShowUpdateModal(true);
    }
  } catch (error) {
    console.error('💥 Version check error:', error);
  }
};
```

**2. Expo console'u açın:**
Tarayıcıda `http://localhost:8081` adresine gidin ve console'da logları görün.

**3. Supabase'i kontrol edin:**

```sql
-- Veri var mı?
SELECT * FROM app_version WHERE platform = 'ios';

-- RLS aktif mi?
SELECT * FROM pg_policies WHERE tablename = 'app_version';
```

**4. AsyncStorage'ı temizleyin:**
Emülatörde uygulamayı sil ve yeniden yükle veya:

```typescript
// Geçici olarak useVersionCheck.ts'e ekleyin
AsyncStorage.removeItem('@dismissed_update_version'); // Test için
```

---

## ✅ TEST SONUÇLARI KONTROLÜ

Her test sonrası kontrol edin:

- [ ] ✅ Popup görünüyor
- [ ] ✅ "Güncelleme Mevcut" başlığı var
- [ ] ✅ Mesaj doğru görünüyor
- [ ] ✅ "Şimdi Güncelle" butonu mavi ve belirgin
- [ ] ✅ "Daha Sonra" butonu çalışıyor (soft update'te)
- [ ] ✅ Force update'te "Daha Sonra" butonu yok
- [ ] ✅ "Şimdi Güncelle" butonu link açıyor
- [ ] ✅ Kapatılan popup tekrar açılmıyor (AsyncStorage)
- [ ] ✅ Yeni versiyon için popup tekrar açılıyor
- [ ] ✅ Platform ayrımı çalışıyor (iOS/Android)

---

## 🔄 NORMALE DÖNDÜRME

Testler bittikten sonra, production hazır hale getirin:

```sql
UPDATE app_version
SET
    minimum_version = '1.0.26',
    current_version = '1.0.26',
    force_update = false,
    update_message = 'Yeni özellikler ve iyileştirmeler mevcut. Lütfen uygulamayı güncelleyin.'
WHERE platform IN ('ios', 'android');
```

Ve `components/UpdateModal.tsx` dosyasındaki gerçek App Store URL'lerini kullandığınızdan emin olun:

```typescript
const APP_STORE_URL = 'https://apps.apple.com/app/id6738264773'; // Gerçek URL
const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.watchbase.app'; // Gerçek URL
```

---

## 🎬 HER ŞEY HAZIR!

Test ettikten sonra production'a build alabilirsiniz. Version kontrolü otomatik olarak her app açılışında çalışacak! 🚀
