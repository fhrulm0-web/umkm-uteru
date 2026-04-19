# POS UMKM Backend Service

Backend service untuk sistem POS UMKM F&B. Repository ini difokuskan pada REST API, logika bisnis transaksi dan stok, serta integrasi database MySQL.

## Scope

Repository ini berisi:

- backend Spring Boot
- integrasi database MySQL
- seed data awal produk dan kategori
- script full dump database
- dokumentasi endpoint backend

Folder `frontend` dapat dipakai sebagai client/prototype integrasi, tetapi inti repository ini ada pada sisi backend.

## Teknologi

- Java 25
- Spring Boot 3
- Spring Web
- Spring Data JPA
- Hibernate
- MySQL
- Maven

## Fitur Backend

- master data produk dan kategori
- checkout transaksi
- penyimpanan detail transaksi
- input stok pagi
- input stok malam
- update stok master
- log stok harian
- riwayat transaksi berdasarkan tanggal

## Struktur

- [backend](/c:/Users/fahrul/Pictures/projek_uteru/backend)
- [database/mysql/00_full_posdb_mysql.sql](/c:/Users/fahrul/Pictures/projek_uteru/database/mysql/00_full_posdb_mysql.sql)
- [docs/backend-api.md](/c:/Users/fahrul/Pictures/projek_uteru/docs/backend-api.md)

## Menjalankan Backend

Prasyarat:

- Java JDK 25
- MySQL Server aktif

Contoh manual:

```powershell
$env:JAVA_HOME="C:\Program Files\Java\jdk-25.0.2"
$env:MYSQL_HOST="localhost"
$env:MYSQL_PORT="3306"
$env:MYSQL_DATABASE="posdb"
$env:MYSQL_USERNAME="root"
$env:MYSQL_PASSWORD="password_mysql_kamu"
cd backend
.\mvnw.cmd spring-boot:run
```

Atau pakai helper script:

- [start-backend.ps1](/c:/Users/fahrul/Pictures/projek_uteru/start-backend.ps1)
- [start-backend.bat](/c:/Users/fahrul/Pictures/projek_uteru/start-backend.bat)

Contoh:

```powershell
.\start-backend.ps1 -MysqlPassword "password_mysql_kamu"
```

Backend akan aktif di:

- `http://localhost:8080`

## Database

Database utama yang dipakai adalah MySQL.

Script yang dipertahankan untuk repo ini:

- [00_full_posdb_mysql.sql](/c:/Users/fahrul/Pictures/projek_uteru/database/mysql/00_full_posdb_mysql.sql)

File tersebut sudah mencakup:

- pembuatan database `posdb`
- tabel utama
- relasi foreign key
- seed kategori dan produk
- data demo transaksi dan stok

## Endpoint Utama

- `GET /api/master/products`
- `POST /api/master/products`
- `GET /api/master/categories`
- `POST /api/master/categories`
- `POST /api/pos/checkout`
- `POST /api/pos/stock/morning`
- `POST /api/pos/stock/night`
- `POST /api/pos/stock/master`
- `GET /api/pos/transactions?from=YYYY-MM-DD&to=YYYY-MM-DD`
- `GET /api/pos/stock/logs?date=YYYY-MM-DD`
- `DELETE /api/pos/transactions/{id}`

Endpoint hapus transaksi mengembalikan `204 No Content` saat berhasil.

## Catatan

- konfigurasi backend sekarang MySQL-only
- H2 sudah dihapus agar repo lebih bersih
- file SQL modular dihapus karena isinya sudah tercakup di full dump `00_full_posdb_mysql.sql`

## Pembaruan Terkini

- **Perbaikan Isu Serialization Tanggal (Jackson):** Menambahkan `spring.jackson.serialization.write-dates-as-timestamps=false` agar `LocalDateTime` tidak dikirim sebagai array integer ke frontend, yang sebelumnya menyebabkan filter laporan harian gagal. Frontend juga dimodifikasi dengan `normalizeDate()` untuk selalu mem-parsing format date array jika ditemui.
- **Perbaikan LazyInitializationException pada Laporan Transaksi & Stok:** Menambahkan `@Transactional(readOnly=true)` di sisi `PosService` (`getTransactionsByDateRange` & `getStockLogsByDate`) dan memperluas anotasi `@EntityGraph` di level Repositori guna mencegah kegagalan *fetch* detail barang dan kategori karena `open-in-view=false`.
- **Perbaikan Cache Frontend:** Memperbaiki bug di `main.js` di mana *cache flag* `hasTransactionHistoryLoaded` menyebabkan data transaksi pos/laporan tidak disegarkan (tidak *fetch* ke backend) dengan benar di antara pergantian *page* atau ketika inisiasi *render* awal.
