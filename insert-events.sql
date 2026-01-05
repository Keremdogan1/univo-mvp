-- Insert mock events into the events table
-- Make sure to run this AFTER the supabase-schema.sql

INSERT INTO public.events (id, title, category, community_id, date, time, location, excerpt, description, image_url) VALUES

-- Event 1: Kampüste Müzik Festivali
('550e8400-e29b-41d4-a716-446655440101', 
 'Kampüste Müzik Festivali',
 'event',
 '550e8400-e29b-41d4-a716-446655440001',
 '2025-01-15T18:00:00+00:00',
 '18:00',
 'Ana Kampüs Meydanı',
 'Üniversite müzik kulübü tarafından düzenlenen yıllık müzik festivali. Öğrenci grupları ve konuk sanatçılar sahne alacak.',
 'Müzik Kulübü olarak düzenlediğimiz yıllık Kampüs Müzik Festivali''ne tüm öğrencileri bekliyoruz!

Akşam 18:00''de başlayacak festival boyunca farklı türlerde müzik yapan öğrenci grupları sahne alacak. Ayrıca şehrin ünlü indie rock grubu da özel konuk olarak sahnede olacak.

Giriş ücretsiz, yiyecek-içecek stantları mevcut. Kampüste sosyalleşmek ve müzik severlerle tanışmak için harika bir fırsat!',
 '/images/music-festival.jpg'),

-- Event 2: Yapay Zeka ve Gelecek Paneli
('550e8400-e29b-41d4-a716-446655440102',
 'Yapay Zeka ve Gelecek Paneli',
 'talk',
 '550e8400-e29b-41d4-a716-446655440002',
 '2025-01-18T14:00:00+00:00',
 '14:00',
 'Mühendislik Fakültesi Konferans Salonu',
 'Yapay zeka alanındaki son gelişmeler ve geleceğe dair öngörülerin tartışılacağı panel. Sektör profesyonelleri ve akademisyenler katılacak.',
 'Bilgisayar Mühendisliği Topluluğu olarak, yapay zeka teknolojilerinin geleceğini ve toplum üzerindeki etkilerini tartışacağımız bir panel düzenliyoruz.

Panelimizde:
- Prof. Dr. Ayşe Yılmaz (Yapay Zeka Araştırma Merkezi)
- Mehmet Kaya (Tech Startup CEO)
- Dr. Zeynep Demir (Etik ve Teknoloji Uzmanı)

konuşmacılarımız yapay zekanın etik boyutları, iş dünyasındaki uygulamaları ve gelecek trendleri hakkında görüşlerini paylaşacak. Etkinlik sonunda soru-cevap bölümü olacak.

Katılım ücretsiz, ancak kontenjan sınırlı. Kayıt için QR kod ile başvuru yapabilirsiniz.',
 '/images/ai-panel.jpg'),

-- Event 3: Bahar Dönemi Ders Kayıtları
('550e8400-e29b-41d4-a716-446655440103',
 'Bahar Dönemi Ders Kayıtları Başladı',
 'announcement',
 '550e8400-e29b-41d4-a716-446655440003',
 '2025-01-10T09:00:00+00:00',
 '09:00',
 'Online - Öğrenci Bilgi Sistemi',
 '2024-2025 Bahar dönemi ders kayıtları 10 Ocak tarihinde başlıyor. Öğrencilerin dikkat etmesi gereken önemli noktalar.',
 'Değerli Öğrencilerimiz,

2024-2025 Bahar Dönemi ders kayıtları 10 Ocak 2025 Cuma günü saat 09:00''da başlayacaktır.

Önemli Noktalar:
- Kayıtlar Öğrenci Bilgi Sistemi (OBS) üzerinden yapılacaktır
- Her sınıf düzeyi için farklı kayıt saatleri belirlenmiştir
- Danışman onayı gereken öğrenciler önceden randevu almalıdır
- Kota dolması durumunda bekleme listesine alınabilirsiniz

Kayıt Tarihleri:
- 1. Sınıf: 10 Ocak 09:00
- 2. Sınıf: 10 Ocak 14:00
- 3. Sınıf: 11 Ocak 09:00
- 4. Sınıf: 11 Ocak 14:00

Sorun yaşayan öğrenciler dekanlık ofisine başvurabilir.',
 NULL),

-- Event 4: Web Geliştirme Workshop
('550e8400-e29b-41d4-a716-446655440104',
 'Web Geliştirme Workshop Serisi',
 'workshop',
 '550e8400-e29b-41d4-a716-446655440004',
 '2025-01-20T15:00:00+00:00',
 '15:00',
 'Bilgisayar Laboratuvarı B-204',
 'Modern web teknolojileri ile full-stack geliştirme öğrenmek isteyenler için 4 haftalık workshop serisi başlıyor.',
 'Yazılım Geliştirme Kulübü olarak Modern Web Geliştirme Workshop Serimizi duyuruyoruz!

4 haftalık bu seride şunları öğreneceksiniz:
- HTML, CSS, JavaScript temelleri
- React framework ile frontend geliştirme
- Node.js ve Express ile backend oluşturma
- MongoDB database entegrasyonu
- Full-stack proje geliştirme

Workshop Programı:
- Hafta 1: Frontend Temelleri (20 Ocak)
- Hafta 2: React ile Modern UI (27 Ocak)
- Hafta 3: Backend ve API Geliştirme (3 Şubat)
- Hafta 4: Full-stack Proje (10 Şubat)

Her workshop 2 saat sürecek ve uygulamalı olacak. Katılımcılar kendi laptoplarını getirmelidir.

Kontenjan: 30 kişi
Kayıt: dev-club@university.edu',
 '/images/web-workshop.jpg'),

-- Event 5: Kitap Değişimi Etkinliği
('550e8400-e29b-41d4-a716-446655440105',
 'Kış Dönemi Kitap Değişimi Etkinliği',
 'event',
 '550e8400-e29b-41d4-a716-446655440005',
 '2025-01-25T12:00:00+00:00',
 '12:00',
 'Merkez Kütüphane Bahçesi',
 'Okuduğunuz kitapları değiştirebileceğiniz, yeni kitaplar keşfedebileceğiniz bir etkinlik. Kahve eşliğinde kitap sohbetleri.',
 'Kitap Kulübü olarak kış döneminin ilk Kitap Değişimi Etkinliğimizi düzenliyoruz!

Nasıl Katılabilirsiniz?
Evinizde okuduğunuz ve başkalarının okumasını istediğiniz kitapları getirebilirsiniz. Her kitap için bir değişim kuponu alacaksınız ve istediğiniz başka bir kitabı alabileceksiniz.

Etkinlikte:
- Kitap değişimi standı
- Sıcak çay ve kahve ikramı
- Kitap önerileri ve tartışmalar
- Yeni arkadaşlıklar

Tüm bölümlerden öğrenciler katılabilir. Geleneksel olarak düzenlediğimiz bu etkinlik kampüsteki edebiyat severleri bir araya getiriyor.

Kitap getirmek zorunlu değil, sadece gezmeye de gelebilirsiniz!',
 NULL),

-- Event 6: Kariyer Günleri
('550e8400-e29b-41d4-a716-446655440106',
 'Kariyer Günleri 2025',
 'event',
 '550e8400-e29b-41d4-a716-446655440006',
 '2025-02-05T10:00:00+00:00',
 '10:00',
 'Spor Salonu',
 'Türkiye''nin önde gelen şirketlerinin katılacağı kariyer fuarı. CV inceleme, mülakat simülasyonu ve networking fırsatları.',
 'Üniversitemiz Kariyer Merkezi olarak düzenlediğimiz Kariyer Günleri 2025 etkinliği 5-6 Şubat tarihlerinde gerçekleşecek!

Katılımcı Şirketler:
- 50+ ulusal ve uluslararası şirket
- Teknoloji, finans, sağlık, mühendislik sektörlerinden firmalar
- Staj ve tam zamanlı iş fırsatları

Etkinlik Programı:
- Şirket stantları ve tanıtımları
- Ücretsiz CV inceleme danışmanlığı
- Mock interview (mülakat simülasyonu)
- Kariyer panelleri ve söyleşiler
- Networking oturumları

Tüm bölüm öğrencileri katılabilir. CV''lerinizi güncelleyip yanınızda getirmenizi tavsiye ediyoruz.

Not: Formal kıyafet zorunlu değil ancak profesyonel görünüm önerilir.',
 '/images/career-fair.jpg'),

-- Event 7: Startup Fikir Yarışması
('550e8400-e29b-41d4-a716-446655440107',
 'Startup Fikir Yarışması',
 'announcement',
 '550e8400-e29b-41d4-a716-446655440007',
 '2025-01-12T17:00:00+00:00',
 '17:00',
 'İnovasyon Merkezi',
 'Kendi startup fikrini sunma fırsatı! En iyi 3 fikre mentorluk ve seed fonlama desteği verilecek.',
 'Girişimcilik Kulübü olarak düzenlediğimiz Startup Fikir Yarışması başvuruları başladı!

Yarışma Detayları:
Kendi iş fikrinizi 5 dakikalık bir sunumla anlatacaksınız. Jüri üyeleri iş planınızı, pazar potansiyelini ve yenilikçiliğinizi değerlendirecek.

Ödüller:
- 1. ödül: 50.000 TL seed fon + 6 ay mentorluk
- 2. ödül: 25.000 TL + 3 ay mentorluk
- 3. ödül: 10.000 TL + 1 ay mentorluk

Başvuru Şartları:
- En az 2, en fazla 4 kişilik ekipler
- Tüm bölümlerden öğrenciler katılabilir
- Özgün bir iş fikri
- İş planı sunumu (şablon web sitesinde)

Önemli Tarihler:
- Son başvuru: 25 Ocak
- Ön eleme sonuçları: 1 Şubat
- Final sunumları: 15 Şubat

Başvuru için: entrepreneurship-club@university.edu',
 '/images/startup-competition.jpg'),

-- Event 8: Fotoğrafçılık Atölyesi
('550e8400-e29b-41d4-a716-446655440108',
 'Fotoğrafçılık Atölyesi: Portre Çekimi',
 'workshop',
 '550e8400-e29b-41d4-a716-446655440008',
 '2025-01-28T13:00:00+00:00',
 '13:00',
 'Sanat Stüdyosu',
 'Portre fotoğrafçılığının temellerini profesyonel fotoğrafçıdan öğreneceğiniz uygulamalı workshop.',
 'Fotoğraf Kulübü olarak Portre Çekimi Workshop''umuzu duyuruyoruz!

Workshop İçeriği:
- Işık kullanımı ve doğal ışık teknikleri
- Kompozisyon ve çerçeveleme
- Portre için lens seçimi
- Model yönlendirme
- Post-processing temelleri

Eğitmen:
Ahmet Yıldız - 15 yıllık deneyime sahip profesyonel portre fotoğrafçısı

Workshop uygulamalı olacak, katılımcılar kendi fotoğraf makinelerini veya telefonlarını getirmelidir. Manuel kontrollere sahip bir kamera önerilir.

Süre: 3 saat
Kontenjan: 15 kişi
Ücret: Ücretsiz (Kulüp üyeleri öncelikli)

Kayıt için kulüp Instagram hesabımızdan DM atabilirsiniz: @universefoto',
 NULL);
