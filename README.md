# Görev ve Proje Takip Uygulaması

React Native ve Node.js kullanılarak geliştirilen mobil görev ve proje takip uygulamasıdır.

Uygulama; kullanıcıların panolar oluşturmasını, panolar içerisinde kolon ve görev yönetimi yapmasını, diğer kullanıcıları panolara eklemesini ve görevler üzerinde birlikte çalışmasını sağlar.

Proje mobil uygulama ve REST API backend olmak üzere iki ana bölümden oluşmaktadır.

---

## Özellikler

### Kullanıcı İşlemleri

- Kullanıcı kaydı
- Giriş yapma
- JWT tabanlı kimlik doğrulama
- SecureStore ile güvenli token saklama
- Profil ekranı
- Çıkış yapma
- Şifre sıfırlama
- 6 haneli doğrulama kodu
- Ethereal Email ile geliştirme ortamında e-posta testi

### Pano Yönetimi

- Yeni pano oluşturma
- Pano düzenleme
- Pano silme
- Kullanıcının sahip olduğu ve üye olduğu panoları görüntüleme
- Pano üyelerini yönetme
- Kayıtlı kullanıcıyı e-posta adresi ile panoya ekleme
- Panodan ayrılma
- Pano sahibi ve üye ayrımı

### Kolon Yönetimi

- Pano içerisinde kolon oluşturma
- Kolon düzenleme
- Kolon silme
- Birden fazla kolon ile Kanban benzeri çalışma yapısı

### Görev Yönetimi

- Görev oluşturma
- Görev düzenleme
- Görev silme
- Göreve açıklama ekleme
- Öncelik belirleme
- Son tarih belirleme
- Görevi pano üyelerinden birine atama
- Göreve dokunarak detay ekranını açma
- Basılı tutarak sürükle-bırak ile kolonlar arasında görev taşıma
- Sürükleme sırasında görev silme alanı

### Görev Yorumları

- Göreve yorum ekleme
- Yorum düzenleme
- Yorum silme
- Yorum sahibinin görüntülenmesi

### Arama ve Filtreleme

- Görev başlığına göre arama
- Görev açıklamasına göre arama
- Önceliğe göre filtreleme
- Atanan kullanıcıya göre filtreleme
- Atanmamış görevleri filtreleme

### Hatırlatmalar

- Son tarihi bulunan görevleri listeleme
- Geciken görevler
- Bugünkü görevler
- Yarınki görevler
- Yaklaşan görevler
- Alt navigasyonda yaklaşan görev sayısı

> Hatırlatma sistemi Expo Go uyumluluğu nedeniyle uygulama içi hatırlatma merkezi olarak geliştirilmiştir.

### Tema

- Açık tema
- Karanlık tema
- Telefonun sistem temasını takip etme
- Tema tercihinin cihazda saklanması

### Offline Kullanım ve Senkronizasyon

- Daha önce yüklenen verileri çevrimdışı görüntüleme
- AsyncStorage ile yerel veri önbelleği
- İnternet bağlantısı kontrolü
- Çevrimdışı yapılan değişiklikleri kuyrukta tutma
- İnternet bağlantısı geri geldiğinde otomatik senkronizasyon
- Manuel senkronizasyon
- Çevrimdışı oluşturulan kayıtlar için geçici ID sistemi
- Geçici ID ve sunucu ID eşleştirmesi
- Bekleyen senkronizasyon sayısının gösterilmesi

---

## Kullanılan Teknolojiler

### Mobil

- React Native
- Expo SDK 57
- React Navigation
- Zustand
- Axios
- Expo SecureStore
- AsyncStorage
- NetInfo
- React Native Gesture Handler
- React Native Reanimated
- Expo Vector Icons
- Community DateTimePicker

### Backend

- Node.js
- Express.js
- Prisma ORM
- SQLite
- JWT
- bcrypt
- Nodemailer
- Ethereal Email

---

## Proje Yapısı

```text
StajMobilProje/
│
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   │
│   ├── src/
│   │   ├── lib/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── utils/
│   │
│   ├── server.js
│   ├── prisma7.config.ts
│   └── package.json
│
├── mobile/
│   ├── assets/
│   ├── src/
│   │   ├── navigation/
│   │   ├── screens/
│   │   ├── services/
│   │   ├── store/
│   │   └── theme/
│   │
│   ├── App.js
│   ├── app.json
│   └── package.json
│
└── README.md