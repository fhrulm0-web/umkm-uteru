# POS UMKM F&B

Aplikasi Point of Sales (POS) full-stack untuk operasional UMKM makanan dan minuman. Frontend dibuat ringan dengan Vanilla JavaScript dan Vite, sedangkan backend memakai Spring Boot, JPA, dan MySQL.

## Fitur Utama

- POS kasir mobile-first untuk checkout cepat.
- Login profile kasir/owner dan pembuatan profile baru oleh owner.
- Menu minuman dengan varian gula untuk es kelapa.
- Es Jeruk dan Es Teh tampil sebagai satu kartu menu dengan pilihan `Cup Besar` dan `Cup Kecil`.
- Produk harga custom untuk item seperti pentol/sempol/kelapa bijian.
- Pembayaran Cash, Transfer, dan QRIS.
- Riwayat transaksi, resi, dan void transaksi.
- Laporan harian, mingguan, bulanan, termasuk menu paling laris.
- Manajemen stok pagi/malam dan stok master berbasis plastik + pcs lepas.
- Asset gambar produk disimpan di `frontend/public/images`.

## Teknologi

Frontend:

- HTML, CSS, Vanilla JavaScript
- Vite

Backend:

- Java 25
- Spring Boot 3
- Spring Web
- Spring Data JPA / Hibernate
- MySQL atau MariaDB

## Struktur Repo

- `frontend/` - source UI kasir.
- `backend/` - REST API Spring Boot.
- `database/` - schema dan seed SQL MySQL.
- `start-all.ps1` / `start-all.bat` - helper untuk menjalankan backend dan frontend.
- `start-backend.ps1` - helper backend saja.
- `start-frontend.ps1` - helper frontend saja.

## Quick Start

Prasyarat:

- Node.js dan npm
- Java JDK 25
- MySQL/MariaDB, atau XAMPP MySQL

Cara paling praktis di Windows PowerShell:

```powershell
.\start-all.ps1 -MysqlPassword "<password_mysql>" -InstallFrontend
```

Atau dari Command Prompt:

```bat
start-all.bat -MysqlPassword "<password_mysql>" -InstallFrontend
```

Script ini akan:

- mencoba menyalakan MySQL XAMPP dari `C:\xampp`,
- mengecek kredensial MySQL,
- menjalankan backend di `http://localhost:8080`,
- menjalankan frontend di `http://localhost:5173`.

Jika MySQL sudah aktif dan tidak perlu dinyalakan oleh script:

```powershell
.\start-all.ps1 -SkipMysql -MysqlPassword "<password_mysql>"
```

Jika XAMPP berada di lokasi lain:

```powershell
.\start-all.ps1 -XamppPath "D:\xampp" -MysqlPassword "<password_mysql>"
```

## Menjalankan Manual

Backend:

```powershell
.\start-backend.ps1 -MysqlPassword "<password_mysql>"
```

Frontend:

```powershell
.\start-frontend.ps1 -Install
```

Frontend tersedia di `http://localhost:5173`. Backend tersedia di `http://localhost:8080`.

## Seed User Awal

User awal tidak dibuat dengan password bawaan. Untuk database baru, aktifkan seed user lokal dengan password sendiri:

```powershell
.\start-all.ps1 `
  -MysqlPassword "<password_mysql>" `
  -SeedUsers `
  -SeedOwnerPassword "<owner-password-kuat>" `
  -SeedStaff1Password "<staff1-password-kuat>" `
  -SeedStaff2Password "<staff2-password-kuat>"
```

Seed user juga bisa dikontrol melalui environment variable:

- `POS_SEED_USERS_ENABLED`
- `POS_SEED_OWNER_PASSWORD`
- `POS_SEED_STAFF1_PASSWORD`
- `POS_SEED_STAFF2_PASSWORD`

## Konfigurasi Environment

Backend membaca konfigurasi berikut:

- `SERVER_PORT` - default `8080`.
- `SERVER_ADDRESS` - default `0.0.0.0`.
- `MYSQL_HOST` - host database.
- `MYSQL_PORT` - port database.
- `MYSQL_DATABASE` - nama database.
- `MYSQL_USERNAME` - username database.
- `MYSQL_PASSWORD` - password database.
- `CORS_ALLOWED_ORIGINS` - default `http://localhost:5173,http://127.0.0.1:5173`.
- `POS_AUTH_RATE_LIMIT_MAX` - default `5`.
- `POS_AUTH_RATE_LIMIT_WINDOW` - default `PT15M`.
- `POS_API_RATE_LIMIT_MAX` - default `300`.
- `POS_API_RATE_LIMIT_WINDOW` - default `PT15M`.
- `POS_MAX_REQUEST_BYTES` - default `65536`.

## Endpoint Penting

- `POST /api/auth/login`
- `GET /api/auth/profiles`
- `POST /api/auth/profiles`
- `GET /api/master/products`
- `GET /api/master/categories`
- `POST /api/pos/checkout`
- `GET /api/pos/transactions`
- `POST /api/pos/stock/morning`
- `POST /api/pos/stock/night`
- `POST /api/pos/stock/master`
- `GET /api/pos/stock/logs`

## Build

Frontend production build:

```powershell
cd frontend
npm run build
```

Backend test/build bisa dijalankan dari folder `backend` dengan Maven wrapper:

```powershell
cd backend
.\mvnw.cmd test
```

## Catatan Data

Produk default di-seed oleh `DataInitializer` saat backend berjalan. SQL lengkap untuk setup manual tersedia di `database/mysql/00_full_posdb_mysql.sql`.
