# 🧪 Versiyon Kontrol Sistemi Test Rehberi

Build almadan önce versiyon kontrolünün doğru çalıştığını test etmek için:

## ✅ Ön Kontroller

### 1. TypeScript Hatalarını Kontrol Edin

```bash
npx tsc --noEmit
```

### 2. Migration'ın Doğru Olduğunu Kontrol Edin

```bash
# Migration dosyasını kontrol et
cat supabase/migrations/20260316000000_app_version_control.sql

# Supabase'e push et
supabase db push
```

### 3. Supabase Tablosunu Kontrol Edin

Supabase Dashboard'da SQL Editor'den:

```sql
SELECT * FROM app_version;
```

Beklenen çıktı:

```
platform | minimum_version | current_version | force_update | update_message
---------|-----------------|-----------------|--------------|----------------
ios      | 1.0.26          | 1.0.26          | false        | Yeni özellikler...
android  | 1.0.26          | 1.0.26          | false        | Yeni özellikler...
```

## 🧪 Development'ta Test Senaryoları

### Test 1: Popup'ın GÖRÜNDÜĞÜNÜ Test Etme

1. **app.json'daki versiyonu not alın** (şu anda `1.0.26`)

2. **Supabase'de minimum_version'ı yükseltin:**

```sql
UPDATE app_version
SET minimum_version = '2.0.0'  -- Mevcut versiyondan yüksek
WHERE platform = 'ios'; -- veya 'android'
```

3. **Uygulamayı dev modda çalıştırın:**

```bash
npm run dev
# Simulator/Emulator'de uygulamayı açın
```

4. **Beklenen Sonuç:**
   - Uygulama açılır açılmaz güncelleme popup'ı görünmeli
   - "Şimdi Güncelle" butonu olmalı
   - "Daha Sonra" butonu olmalı (force_update false ise)

### Test 2: Zorunlu Güncellemeyi Test Etme

```sql
UPDATE app_version
SET
  minimum_version = '2.0.0',
  force_update = true
WHERE platform = 'ios';
```

**Beklenen Sonuç:**

- Popup'ta sadece "Şimdi Güncelle" butonu olmalı
- "Daha Sonra" butonu OLMAMALI

### Test 3: Market Yönlendirmesini Test Etme

1. Popup göründüğünde "Şimdi Güncelle" butonuna tıklayın
2. **Beklenen Sonuç:**
   - iOS'ta Safari açılıp App Store'a yönlenmeli
   - Android'de Play Store açılmalı

### Test 4: "Daha Sonra" Butonunu Test Etme

1. Popup'ta "Daha Sonra" butonuna tıklayın
2. Uygulamayı tamamen kapatıp tekrar açın
3. **Beklenen Sonuç:**
   - Popup bir daha GÖRMEMELI (aynı versiyon için)

4. Yeni versiyon yayınlayın:

```sql
UPDATE app_version
SET minimum_version = '3.0.0'
WHERE platform = 'ios';
```

5. Uygulamayı tekrar açın
6. **Beklenen Sonuç:**
   - Popup tekrar görünmeli (yeni versiyon için)

### Test 5: Platform Ayrımını Test Etme

```sql
-- iOS için yüksek versiyon
UPDATE app_version
SET minimum_version = '2.0.0'
WHERE platform = 'ios';

-- Android için düşük versiyon
UPDATE app_version
SET minimum_version = '1.0.0'
WHERE platform = 'android';
```

**iOS Simulator'de:** Popup görmeli
**Android Emulator'de:** Popup görmemeli

### Test 6: Popup'ın GÖRÜNMEMESINI Test Etme

```sql
-- Versiyonu mevcut app versiyonu ile aynı yapın
UPDATE app_version
SET minimum_version = '1.0.26'
WHERE platform = 'ios';
```

**Beklenen Sonuç:**

- Popup hiç görünmemeli
- Uygulama normal açılmalı

## 🔍 Console Logları

Hook'ta console.log ekleyerek debug yapabilirsiniz:

`hooks/useVersionCheck.ts` dosyasında:

```typescript
console.log('Current Version:', currentVersion);
console.log('Minimum Required:', versionInfo.minimum_version);
console.log('Comparison Result:', comparison);
console.log('Should Show Update:', comparison < 0);
```

## 📱 Gerçek Cihazda Test

### iOS (TestFlight)

1. TestFlight'a build yükleyin
2. Versiyonu `1.0.26` olarak bırakın
3. Supabase'de minimum_version'ı `1.0.27` yapın
4. TestFlight'tan uygulamayı açın
5. Popup görünmeli

### Android (Internal Testing)

1. Google Play Console'da internal testing track'e yükleyin
2. Versiyonu `1.0.26` olarak bırakın
3. Supabase'de minimum_version'ı `1.0.27` yapın
4. Test kullanıcısı olarak uygulamayı açın
5. Popup görünmeli

## ✅ Checklist

Build almadan önce:

- [ ] `npx tsc --noEmit` hatasız çalışıyor
- [ ] Migration Supabase'de başarıyla çalıştırıldı
- [ ] `app_version` tablosu doğru verileri içeriyor
- [ ] iOS App Store URL güncellendi (`UpdateModal.tsx`)
- [ ] Test senaryoları dev ortamında çalıştı
- [ ] Popup görünüm testi başarılı
- [ ] "Şimdi Güncelle" butonu markete yönlendiriyor
- [ ] "Daha Sonra" butonu çalışıyor
- [ ] Zorunlu güncelleme modu test edildi
- [ ] AsyncStorage'da dismissed version kaydediliyor

## 🚨 Sorun Giderme

### Popup Hiç Görünmüyor

```sql
-- Supabase'de veriyi kontrol edin
SELECT * FROM app_version WHERE platform = 'ios'; -- veya 'android'

-- RLS policy'yi kontrol edin
SELECT * FROM pg_policies WHERE tablename = 'app_version';
```

### "Cannot read property..." Hatası

- `expo-constants` paketinin yüklü olduğundan emin olun
- `app.json` dosyasında `version` alanının olduğunu kontrol edin

### Market'e Yönlenmiyor

- URL'lerin doğru olduğunu kontrol edin
- iOS Simulator'de App Store açılmayabilir (gerçek cihazda test edin)

## 🎯 Hızlı Test Komutu

Terminal'de:

```bash
# Migration'ı push et
supabase db push

# TypeScript kontrolü
npx tsc --noEmit

# Dev server'ı başlat
npm run dev
```

## 📝 Test Sonrası

Test tamamlandıktan sonra Supabase'de versiyonları normalize edin:

```sql
UPDATE app_version
SET minimum_version = '1.0.26', force_update = false
WHERE platform IN ('ios', 'android');
```

Build almadan önce tüm testler başarılı olmalı! ✅
