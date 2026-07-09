# CLAUDE.md

WatchBase (slug: `watchbase`, filmark) — Expo (SDK 54) + React Native uygulaması.
Auth için **Supabase** kullanılıyor. Native klasörler mevcut (prebuild + `expo-dev-client`),
yani Expo Go değil, **development build** ile çalışır.

- Supabase proje URL: `https://pplkrcndmnwbffasrxkx.supabase.co`
- iOS bundle / Android package: `com.watchbase.app`
- Ortam değişkenleri `.env` içinde (`EXPO_PUBLIC_*`)

## Google ile Giriş / Kayıt (Native)

Google girişi **native** yöntemle eklendi: `@react-native-google-signin/google-signin`
ile sistem hesap seçici açılır → alınan ID token Supabase'e `signInWithIdToken` ile verilir.
Google'da kayıt ve giriş **tek akıştır** — ilk girişte Supabase hesabı otomatik oluşturur.

### Kod tarafı (bu repoda)
- `lib/supabase.ts` → `signInWithGoogle()` helper (native picker → ID token → Supabase).
- `app/(auth)/login.tsx` → "Continue with Google" butonu + inline SVG Google logosu (`GoogleLogo`).
- `locales/*.json` → 13 dile `auth.orContinueWith`, `auth.continueWithGoogle`.
- `.env` → `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
  (secret uygulamada tutulmaz, sadece Supabase panelinde).
- `app.json` → google-signin config plugin (`iosUrlScheme`) + `expo-build-properties.ios.extraPods`
  (GoogleUtilities/RecaptchaInterop/AppCheckCore için `modular_headers`).

### iOS native — ÖNEMLİ GOTCHA
`ios/` klasörü zaten var olduğu için `expo prebuild`/`run:ios` **Podfile ve Info.plist'i
yeniden üretmez**; app.json'daki config plugin ayarları otomatik uygulanmaz. Bu yüzden ELLE eklendi:
- `ios/Podfile` → `pod 'GoogleUtilities'/'RecaptchaInterop'/'AppCheckCore', :modular_headers => true`
  (yoksa `pod install` "cannot yet be integrated as static libraries" hatası verir).
- `ios/WatchBase/Info.plist` → `CFBundleURLTypes` içine Google URL scheme:
  `com.googleusercontent.apps.969827516914-qbgj50f2436o9r92cdal9n0ont0hqkv1`
  (yoksa buton "app is missing support for the following URL schemes" hatası verir).

> `expo prebuild --clean` çalıştırılırsa bu ikisi app.json config'inden yeniden üretilir,
> ama mevcut `ios/` üzerinde manuel tutuluyorlar.

### Android native — ÖNEMLİ GOTCHA (SHA-1)
Android'de google-signin autolink olur (Podfile/Info.plist gibi elle düzeltme veya URL scheme
gerekmez). AMA Google, tokeni ancak APK'yı imzalayan sertifikanın SHA-1'i Google Cloud'daki
Android OAuth client'ta kayıtlıysa verir; aksi halde native hesap seçici açılır ama seçince
**`DEVELOPER_ERROR`** alınır.
- Bu proje `android/app/build.gradle`'da KENDİ `android/app/debug.keystore`'unu kullanır
  (`~/.android/debug.keystore` DEĞİL). Gerçek imza SHA-1'i mutlaka APK'dan doğrulanmalı:
  `keytool -printcert -jarfile android/app/build/outputs/apk/debug/app-debug.apk`
- `release` signingConfig de yerelde `signingConfigs.debug`'a işaret ediyor (build.gradle).

### Dış kurulum (Google Cloud + Supabase — kod dışı)
- **Google Cloud Console** (hesap: `watchbaseinfo@gmail.com`, proje: `watchbase-501919`):
  3 OAuth Client ID — Web, iOS (bundle `com.watchbase.app`), Android (package + SHA-1).
  - Web redirect URI: `https://pplkrcndmnwbffasrxkx.supabase.co/auth/v1/callback`
  - Debug SHA-1 (yerel geliştirme): `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
    (projenin KENDİ `android/app/debug.keystore`'undan — `~/.android/debug.keystore` DEĞİL!
     doğrulamak için: `keytool -printcert -jarfile android/app/build/outputs/apk/debug/app-debug.apk`)
- **Supabase** → Authentication → Providers → Google: enabled, üç client ID (virgüllü),
  Web secret, **Skip nonce checks: ON** (native/iOS için gerekli).

### Test durumu (bu oturum)
- **iOS:** simulator'da (iPhone 15 Pro Max) uçtan uca **çalışıyor** ✅ — native hesap seçici →
  Supabase oturumu → profile. `gonnawalk.yt@gmail.com` ile giriş doğrulandı.
- **Android:** Pixel 8 emulator'da build + kurulum OK, native hesap seçici (Credential Manager)
  **açılıyor** ✅ ama hesap seçince **`DEVELOPER_ERROR`** — çünkü Google Cloud Android client'ına
  önce YANLIŞ SHA-1 (`0F:1A:...`) girilmişti. Doğru SHA-1 (`5E:8F:16:...`) console'a eklenince
  düzelir (yayılması birkaç dk sürebilir). **Bunun eklenmesi bekleniyor.**

### Yapılacaklar / dikkat
- **Android SHA-1 (aktif):** Google Cloud → Clients → Android client'a
  `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25` eklenmeli (DEVELOPER_ERROR fix).
- **Production (Play Store):** Play Console → App Signing'deki production SHA-1'i de Android
  OAuth client'a eklemek gerekir, yoksa mağaza sürümünde Google girişi çalışmaz.
- **Bot spam koruması:** Ertelendi. Kayıt formu CAPTCHA'sız; botlar sahte e-postalarla signup
  deneyip Supabase onay maillerinin bounce olmasına yol açıyor. Supabase → Auth → Attack
  Protection'dan CAPTCHA (hCaptcha) açılabilir (uygulama tarafına da entegrasyon + rebuild ister).

## Bilinen tuzaklar
- **package.json'da olmayan importlar:** Kodda kullanılan bazı paketler `package.json`'a
  kaydedilmemişti; herhangi bir `npm install` bunları node_modules'tan budar ve build'de
  "Cannot find native module" hatası çıkar. Örn. `expo-image-picker` düzeltildi (`~17.0.11`).
  Yeni native paket eklerken hep `npx expo install <paket>` kullan (package.json'a yazar).
- **Metro stale cache:** Silinmiş bir dosyaya dair "Cannot find native module" hatası görürsen
  `npx expo start --dev-client --clear` ile önbelleği temizle.

## Sık kullanılan komutlar
- Dev server: `npm run dev` (`EXPO_NO_TELEMETRY=1 npx expo start`)
- iOS build+run: `npx expo run:ios`
- Android build+run: `npx expo run:android`
- Paket ekleme: `npx expo install <paket>`  (asla düz `npm install <paket>` değil)
