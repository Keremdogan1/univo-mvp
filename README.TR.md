
<div align="center">

# 🏛️ UNIVO
### *Kampüsün Dijital Kalbi*

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-Styling-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Status](https://img.shields.io/badge/Status-v1.0.1_Release-blue?style=for-the-badge&logo=github)](https://github.com/)

<!-- Language Switcher -->
<p align="center">
  <a href="README.md">
    <img src="https://img.shields.io/badge/English-Switch_to_English-0056D2?style=for-the-badge&logo=google-translate&logoColor=white" alt="Switch to English">
  </a>
  <a href="README.TR.md">
    <img src="https://img.shields.io/badge/Türkçe-Aktif-2ea44f?style=for-the-badge&logo=google-translate&logoColor=white" alt="Türkçe">
  </a>
</p>

<p align="center">
  <img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbmV3bWY3cW55cnZ5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z/xTiTnxpQ3ghPiB2Hp6/giphy.gif" width="100%" alt="Univo Banner Animation">
  <!-- (Placeholder for actual demo GIF if available in future) -->
</p>

---

## 🚀 Sürüm Notları: v1.0.0 → v1.0.1
**📅 11 Ocak 2026**

Bugünkü güncellemeyle **Univo** çok daha stabil, hızlı ve kullanıcı dostu hale geldi. İşte **v1.0.1** ile gelen yenilikler:

### ✨ Öne Çıkan Değişiklikler
- **🎨 Kristal Netliğinde UI (Header Sync):**
    - PC başlığındaki (Header) ve sayfa gövdesi arasındaki milisaniyelik gecikme **tamamen yok edildi**.
    - Artık sayfa yüklenirken "beyaz flash" veya kayma olmuyor; `HeaderSkeleton` ve `!transition-none` optimizasyonları ile yağ gibi akan bir deneyim.
- **📝 Sorunsuz Post Düzenleme:**
    - Gönderilerinizi ve **#hashtaginizi** artık güvenle düzenleyebilirsiniz.
    - Sunucu tabanlı doğrulama sistemi eklendi: Sizin ekranınızda gördüğünüz, veritabanına giren veriyle birebir aynı.
- **⚡ Akıllı Gündem (Smart Agenda):**
    - Bir postu güncellediğinizde "Kampüste Gündem" (Sidebar) kartları anında, sayfa yenilenmesine gerek kalmadan kendini günceller.
- **🧹 Proje Temizliği:**
    - Kök dizindeki onlarca geçici dosya ve log temizlendi. SQL dosyaları `database/` altına, eski assetler `archive/` altına taşındı.

### 🛠️ Teknik İyileştirmeler (Changelog)
> **v1.0.1**
> * `fix(ui)`: PC Header geçiş animasyonları kaldırılarak senkronizasyon sağlandı.
> * `feat(skeleton)`: `HeaderSkeleton`, `VoiceViewSkeleton`, `CommunityViewSkeleton` bileşenleri eklendi.
> * `fix(api)`: `PUT /api/voices/[id]` endpoint'inden `.single()` kaldırılarak "Cannot coerce..." hatası çözüldü.
> * `fix(frontend)`: `VoiceView` içinde edit sonrası anlık state güncellemesi (Optimistic Update -> Server Confirmation).
> * `chore`: Proje dosya yapısı temizlendi, gereksiz `.sql` ve loglar ayrıştırıldı.

---

## 🎉 İlk Sürüm: v1.0.0 (MVP)
**📅 10 Ocak 2026**

Univo'nun doğuşu. Kampüs deneyimini dijitalleştiren ilk kararlı sürüm.

### 🏛️ Çekirdek Özellikler (Initial Release)
- **Kimlik Doğrulama:**
    - Google ile Tek Tıkla Giriş (Supabase Auth).
    - `@metu.edu.tr` e-posta doğrulama desteği.
    - Profil oluşturma (Takma ad, Bölüm, Avatar).
- **Kampüsün Sesi (Beta):**
    - Anonim veya açık kimlikle gönderi paylaşımı.
    - Beğeni (Like/Dislike) ve Yorum sistemi.
    - "Editörün Seçimi" ve "Sıcak Gündem" filtreleri.
- **Topluluk Meydanı:**
    - Etkinlik listeleme ve detay görüntüleme.
    - "Katıl" butonu ile etkinliklere kayıt (RSVP).
    - Etkinlik kategorileri (Seminer, Parti, Kariyer).
- **Resmi Gündem:**
    - Yemekhane menüsü entegrasyonu (Anlık Veri).
    - Üniversite duyuruları ve akademik takvim.
- **Arayüz:**
    - Modern, duyarlı (Responsive) tasarım.
    - Karanlık/Aydınlık Mod desteği.
    - Alt navigasyon çubuğu ile kolay erişim (Mobil).

---

## 🌟 Temel Özellikler

### 📢 Kampüsün Sesi (Voices)
Öğrencilerin anonim veya açık kimlikle fikirlerini paylaştığı özgür alan.
- **Anonim Mod:** Kimliğinizi gizleyerek tartışmalara katılın.
- **Hashtag Desteği:** `#vize`, `#festival` gibi etiketlerle gündemi belirleyin.
- **Moderasyon:** Güvenli bir kampüs ortamı için otomatik ve manuel filtreler.

### 🏘️ Topluluk Meydanı (Community)
Kulüpler, topluluklar ve etkinliklerin buluşma noktası.
- **Etkinlik Kartları:** Tarih, yer ve detayları içeren şık kartlar.
- **Rozet Sistemi:** Katıldığınız etkinliklerle profilinizi "Topluluk Yıldızı"na dönüştürün.
- **Kategoriler:** Müzik, Bilim, Spor... İlgi alanınıza göre filtreleyin.

### 🏛️ Resmi Gündem (Official Agenda)
Üniversitemizden en son duyurular, yemekhane menüsü ve resmi haberler.
- **Yemek Menüsü:** Günün menüsünü fotoğraflı ve kalorili görün.
- **Akademik Takvim:** Kritik tarihleri asla kaçırmayın.
- **Önbellek (Caching):** İnternetiniz yavaş olsa bile son görüntülenen duyurulara anında erişin.

---

## 💻 Tech Stack
Bu proje modern web teknolojilerinin en güncel sürümleriyle inşa edilmiştir.

| Alan | Teknoloji | Notlar |
| :--- | :--- | :--- |
| **Frontend** | [Next.js 15 (App Router)](https://nextjs.org) | Server Components & Suspense |
| **Dil** | [TypeScript](https://www.typescriptlang.org/) | Tip güvenliği ve ölçeklenebilirlik |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Utility-first design & animate-shimmer |
| **Backend / DB** | [Supabase](https://supabase.com/) | PostgreSQL, Auth, Realtime, Storage |
| **State** | React Hooks & Context | Lightweight client state management |

---

## 🚀 Kurulum (Local Development)

Projeyi kendi bilgisayarınızda çalıştırmak için:

1.  **Repoyu Klonlayın:**
    ```bash
    git clone https://github.com/keremdogan1/univo-mvp.git
    cd univo-mvp
    ```

2.  **Bağımlılıkları Yükleyin:**
    ```bash
    npm install
    # veya
    bun install
    ```

3.  **Çevresel Değişkenler (.env.local):**
    Proje kök dizininde `.env.local` oluşturun ve Supabase anahtarlarınızı girin:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Uygulamayı Başlatın:**
    ```bash
    npm run dev
    ```
    Tarayıcınızda `http://localhost:3000` adresine gidin.

---

</div>
