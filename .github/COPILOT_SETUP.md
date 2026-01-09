# GitHub Copilot Kurulum Rehberi / Setup Guide

## Türkçe

### GitHub Copilot Agent'ı VS Code'da Açma

Bu repository artık GitHub Copilot ile kullanıma hazır! Aşağıdaki adımları takip ederek Copilot'u aktif edebilirsiniz:

#### Gereksinimler
1. Visual Studio Code yüklü olmalı
2. GitHub Copilot aboneliğiniz olmalı (veya ücretsiz deneme)

#### Kurulum Adımları

1. **VS Code'u Açın**
   - Bu repository'yi VS Code'da açın

2. **Önerilen Eklentileri Yükleyin**
   - VS Code sağ alt köşede "Bu çalışma alanı için önerilen eklentileri yüklemek ister misiniz?" mesajı göreceksiniz
   - "Hepsini Yükle" (Install All) butonuna tıklayın
   - Veya manuel olarak şu eklentileri yükleyin:
     - GitHub Copilot
     - GitHub Copilot Chat

3. **GitHub Hesabınızla Giriş Yapın**
   - VS Code'da sol alt köşedeki hesap ikonuna tıklayın
   - "Sign in to use GitHub Copilot" seçeneğini seçin
   - Tarayıcıda açılan sayfada GitHub hesabınızla giriş yapın

4. **Copilot'u Kullanmaya Başlayın**
   - Kod yazarken Copilot otomatik önerilerde bulunacak
   - Chat için: `Ctrl+I` (Windows/Linux) veya `Cmd+I` (Mac) tuşlarına basın
   - Veya sol panelde sohbet ikonuna tıklayın

#### Copilot Chat ile Proje Hakkında Sorular

Copilot Chat'te şunları sorabilirsiniz:
- "Bu projenin yapısını açıkla"
- "Yeni bir film listesi ekranı nasıl oluştururum?"
- "Supabase authentication nasıl çalışıyor?"
- "@workspace navigasyon yapısı nasıl?"

---

## English

### Opening GitHub Copilot Agent in VS Code

This repository is now ready to use with GitHub Copilot! Follow these steps to activate Copilot:

#### Requirements
1. Visual Studio Code installed
2. GitHub Copilot subscription (or free trial)

#### Setup Steps

1. **Open VS Code**
   - Open this repository in VS Code

2. **Install Recommended Extensions**
   - VS Code will show a notification: "Do you want to install the recommended extensions for this repository?"
   - Click "Install All"
   - Or manually install:
     - GitHub Copilot
     - GitHub Copilot Chat

3. **Sign in with GitHub**
   - Click the account icon in the bottom left of VS Code
   - Select "Sign in to use GitHub Copilot"
   - Sign in with your GitHub account in the browser

4. **Start Using Copilot**
   - Copilot will provide suggestions as you code
   - For Chat: Press `Ctrl+I` (Windows/Linux) or `Cmd+I` (Mac)
   - Or click the chat icon in the left panel

#### Ask Questions About the Project with Copilot Chat

You can ask in Copilot Chat:
- "Explain the structure of this project"
- "How do I create a new movie list screen?"
- "How does Supabase authentication work?"
- "@workspace how is navigation structured?"

---

## Yapılandırma Dosyaları / Configuration Files

Bu repository şu yapılandırma dosyalarını içerir:

- `.github/copilot-instructions.md` - Copilot'a proje hakkında bağlam sağlar
- `.vscode/settings.json` - VS Code ayarları (otomatik formatlama, TypeScript yapılandırması)
- `.vscode/extensions.json` - Önerilen VS Code eklentileri

## Sorun Giderme / Troubleshooting

### Copilot Çalışmıyor / Copilot Not Working

1. GitHub Copilot eklentisinin yüklü ve aktif olduğunu kontrol edin
2. GitHub hesabınızla giriş yaptığınızdan emin olun
3. Copilot aboneliğinizin aktif olduğunu doğrulayın: https://github.com/settings/copilot
4. VS Code'u yeniden başlatın

### Öneriler Görünmüyor / No Suggestions Appearing

1. VS Code ayarlarında Copilot'un etkin olduğunu kontrol edin:
   - `Ctrl+,` (Settings) açın
   - "Copilot" aratın
   - "Enable Auto Completions" seçeneğinin aktif olduğundan emin olun

2. Dosya türünün desteklendiğinden emin olun (TypeScript, JavaScript, JSON, vb.)

### Daha Fazla Yardım / More Help

- [GitHub Copilot Documentation](https://docs.github.com/en/copilot)
- [VS Code Copilot Guide](https://code.visualstudio.com/docs/editor/artificial-intelligence)
