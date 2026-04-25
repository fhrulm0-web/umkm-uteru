# POS UMKM F&B (Full-Stack)

Aplikasi *Point of Sales* (POS) modern *full-stack* yang dirancang khusus untuk memenuhi kebutuhan bisnis UMKM Food & Beverage. Solusi ini mencakup antarmuka kasir yang responsif (Frontend) dan sistem manajemen persediaan/transaksi yang andal (Backend API).

## 📌 Fitur Utama

Aplikasi ini mendukung operasional harian kedai makanan/minuman dengan fitur lengkap:
* **Sistem Kasir (POS):** Antarmuka interaktif untuk memproses pesanan, dukungan varian produk, harga kustom, dan penghitungan kembalian.
* **Manajemen Transaksi:** Rekaman *checkout* dengan berbagai metode pembayaran (Cash, Transfer, QRIS) dan kapabilitas pembatalan transaksi (*void*).
* **Laporan Penjualan:** Dasbor analitik untuk melihat total pendapatan, jumlah transaksi, rata-rata transaksi, dan menu terlaris berdasarkan rentang waktu.
* **Sistem Manajemen Stok:** 
  * Pelacakan *stok harian* (Shift Pagi & Shift Malam).
  * Pembaruan data *stok master* per produk (dukungan penghitungan satuan kemasan *pack/loose pcs*).
  * Perhitungan pemakaian otomatis berdasarkan input harian.

## 🛠️ Teknologi yang Digunakan

Proyek aplikasi terbagi menjadi dua bagian utama: Frontend dan Backend.

### Frontend
Aplikasi klien yang ringan dan sangat cepat, dijalankan secara *client-side*.
* HTML5 & CSS3 (Desain responsif *mobile-first*)
* Vanilla JavaScript (Pengelolaan *state* fungsional manual)
* Vite (Lintasan *build* dan lingkungan pengembangan/HMR)

### Backend
REST API yang tangguh untuk memproses data keamanan bisnis.
* Java 25
* Spring Boot 3
* Spring Web & Spring Data JPA (Hibernate)
* MySQL Database

## 📂 Struktur Repositori

* `/frontend` - Repositori *source code* aplikasi UI klien.
* `/backend` - Repositori *source code* untuk REST server Java.
* `/database` - Skema database mentah, *seeding data*, dan utilitas migrasi.

## 🚀 Panduan Menjalankan Aplikasi

### Prasyarat:
* Node.js & npm (untuk Frontend)
* Java JDK 25 (untuk Backend)
* MySQL Server (berjalan pada port 3306)

### 1. Menjalankan Backend (Server API)
Jalankan di terminal/PowerShell pertama:
```powershell
$env:JAVA_HOME="C:\Program Files\Java\jdk-25.0.2"
$env:MYSQL_HOST="localhost"
$env:MYSQL_PORT="3306"
$env:MYSQL_DATABASE="posdb"
$env:MYSQL_USERNAME="root"
$env:MYSQL_PASSWORD="<password_mysql_kamu>"
cd backend
.\mvnw.cmd spring-boot:run
```
*Atau* gunakan file *helper* bawaan: `.\start-backend.ps1 -MysqlPassword "<password>"`

User awal tidak lagi dibuat dengan password bawaan. Untuk database baru, buat user lewat API setelah login dengan akun yang sudah ada, atau aktifkan seed user hanya saat setup lokal:
```powershell
$env:POS_SEED_USERS_ENABLED="true"
$env:POS_SEED_OWNER_PASSWORD="<owner-password-kuat>"
$env:POS_SEED_STAFF1_PASSWORD="<staff1-password-kuat>"
$env:POS_SEED_STAFF2_PASSWORD="<staff2-password-kuat>"
```

Konfigurasi keamanan penting:
* `CORS_ALLOWED_ORIGINS` - origin frontend yang diizinkan, default `http://localhost:5173,http://127.0.0.1:5173`.
* `POS_AUTH_RATE_LIMIT_MAX` dan `POS_AUTH_RATE_LIMIT_WINDOW` - default 5 percobaan auth per 15 menit.
* `POS_API_RATE_LIMIT_MAX` dan `POS_API_RATE_LIMIT_WINDOW` - default 300 request API per 15 menit.
* `POS_MAX_REQUEST_BYTES` - default 65536 byte per payload API.

Servis backend akan berjalan di `http://localhost:8080`.

### 2. Menjalankan Frontend (Client Web)
Buka terminal/PowerShell baru tab kedua:
```powershell
cd frontend
npm install
npm run dev
```
Aplikasi aplikasi kasir dapat diakses pada *browser* Anda melalui `http://localhost:5173`.

## 📜 Pembaruan Terkini

* **Integrasi Database Backend:** Menghapus sepenuhnya *mock cache* internal untuk *deployment production*, secara penuh mentransisikan penyimpanan state ke tabel MariaDB/MySQL Backend H2 yang sinkron.
* **Perbaikan Isu Serialization Tanggal (Jackson):** Menambahkan `write-dates-as-timestamps=false` agar pengiriman `LocalDateTime` antar frontend dan backend tervalidasi ISO format yang akurat saat *query* filter.
* **Penyempurnaan Lazy Initialization JPA:** Menangani transaksi berlapis relasi dengan Hibernate agar data JSON di endpoint API terekstrak sepenuhnya dengan penggunaan `@Transactional` serta pelebaran `@EntityGraph`.
