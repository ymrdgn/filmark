# App Version Control (Uygulama Versiyon Kontrolü)

Bu sistem, kullanıcılara eski versiyon kullandıklarında otomatik olarak güncelleme popup'ı gösterir.

## 🚀 Kurulum

### 1. Migration'ı Çalıştırın

```bash
# Supabase'e migration'ı push edin
supabase db push

# veya manuel olarak SQL dosyasını çalıştırın:
# supabase/migrations/20260316000000_app_version_control.sql
```

### 2. App Store URL'lerini Güncelleyin

`components/UpdateModal.tsx` dosyasında iOS App Store URL'inizi güncelleyin:

```typescript
const APP_STORE_URL = 'https://apps.apple.com/app/id6738264773'; // ← Buraya kendi App Store URL'inizi ekleyin
const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.watchbase.app';
```

## 📊 Versiyon Yönetimi

### Supabase'de Versiyon Güncelleme

Supabase Dashboard > SQL Editor'den şu komutu çalıştırın:

```sql
-- iOS için minimum versiyonu güncelleme
UPDATE app_version
SET
  minimum_version = '1.0.27',
  current_version = '1.0.27',
  force_update = false,  -- true ise kullanıcı güncelleme yapmadan devam edemez
  update_message = 'Yeni özellikler ve iyileştirmeler mevcut. Lütfen uygulamayı güncelleyin.'
WHERE platform = 'ios';

-- Android için minimum versiyonu güncelleme
UPDATE app_version
SET
  minimum_version = '1.0.27',
  current_version = '1.0.27',
  force_update = false,
  update_message = 'Yeni özellikler ve iyileştirmeler mevcut. Lütfen uygulamayı güncelleyin.'
WHERE platform = 'android';
```

## 🔧 Nasıl Çalışır?

1. **Otomatik Kontrol**: Uygulama açıldığında, `useVersionCheck` hook'u Supabase'den minimum gerekli versiyonu kontrol eder
2. **Versiyon Karşılaştırması**: Cihazda yüklü versiyon ile minimum gerekli versiyon karşılaştırılır
3. **Popup Gösterimi**: Eğer cihaz versiyonu eskiyse, otomatik olarak güncelleme popup'ı gösterilir
4. **Markete Yönlendirme**: "Şimdi Güncelle" butonuna tıklandığında kullanıcı ilgili marketecek yönlendirilir (iOS için App Store, Android için Play Store)

## ⚙️ Özellikler

### Force Update (Zorunlu Güncelleme)

`force_update = true` yaparsanız:

- Kullanıcı "Daha Sonra" butonunu göremez
- Güncelleme yapmadan uygulamaya devam edemez

### Soft Update (İsteğe Bağlı Güncelleme)

`force_update = false` yaparsanız:

- Kullanıcı "Daha Sonra" butonunu görebilir
- Bir kez reddederse, aynı versiyon için bir daha popup gösterilmez
- Yeni versiyon yayınlandığında tekrar popup gösterilir

## 📝 Versiyon Numaralandırma

- **Semantic Versioning** kullanılır: `MAJOR.MINOR.PATCH`
- Örnek: `1.0.26` → `1.0.27`
- Sistem otomatik olarak karşılaştırma yapar

## 🔄 Güncelleme Senaryoları

### Senaryo 1: Kritik Güncelleme

```sql
UPDATE app_version
SET minimum_version = '1.1.0', force_update = true
WHERE platform = 'ios';
```

→ Kullanıcı zorunlu güncelleme yapmalı

### Senaryo 2: Yeni Özellikler

```sql
UPDATE app_version
SET minimum_version = '1.0.28', force_update = false,
    update_message = '🎉 Yeni özellikler eklendi! Lütfen güncelleme yapın.'
WHERE platform = 'android';
```

→ Kullanıcı isterse daha sonra güncelleyebilir

## 🎨 Özelleştirme

Modal tasarımını değiştirmek için `components/UpdateModal.tsx` dosyasındaki `styles` objesini düzenleyin.

## 📱 Test Etme

Test için Supabase'de `minimum_version`'ı mevcut app versiyonundan daha yüksek bir değere ayarlayın:

```sql
-- Test için
UPDATE app_version
SET minimum_version = '2.0.0'
WHERE platform = 'ios';
```

Uygulamayı yeniden açtığınızda popup'ı göreceksiniz.
