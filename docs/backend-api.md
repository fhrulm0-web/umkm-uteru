# Backend API Summary

Dokumen ini merangkum endpoint utama pada backend POS UMKM.

## Base URL

```text
http://localhost:8080
```

## Master Data

### `GET /api/master/products`

Mengambil daftar produk aktif.

### `POST /api/master/products`

Menambahkan produk baru.

Contoh body:

```json
{
  "name": "Es Teh Baru",
  "description": "Teh manis dingin",
  "price": 5000,
  "isActive": true,
  "isCustomPrice": false,
  "trackStock": false,
  "currentStockPcs": 0
}
```

### `GET /api/master/categories`

Mengambil daftar kategori.

### `POST /api/master/categories`

Menambahkan kategori baru.

Contoh body:

```json
{
  "name": "Minuman"
}
```

## Checkout dan Transaksi

### `POST /api/pos/checkout`

Menyimpan transaksi checkout baru.

Contoh body:

```json
{
  "cashierName": "Owner",
  "paymentMethod": "CASH",
  "totalAmount": 18000,
  "amountPaid": 20000,
  "changeAmount": 2000,
  "details": [
    {
      "productName": "Kelapa Bijian",
      "quantity": 1,
      "priceAtTime": 18000,
      "subtotal": 18000
    }
  ]
}
```

### `GET /api/pos/transactions?from=YYYY-MM-DD&to=YYYY-MM-DD`

Mengambil transaksi berdasarkan rentang tanggal.

### `DELETE /api/pos/transactions/{id}`

Menghapus satu transaksi berdasarkan id.

Response sukses:

```text
204 No Content
```

## Stok

### `POST /api/pos/stock/morning`

Menyimpan stok awal shift pagi.

Contoh body:

```json
{
  "productId": 21,
  "packQuantity": 1,
  "loosePcsQuantity": 5,
  "staffName": "Bu Rani"
}
```

### `POST /api/pos/stock/night`

Menyimpan stok sisa shift malam.

Contoh body:

```json
{
  "productId": 21,
  "packQuantity": 0,
  "loosePcsQuantity": 44,
  "staffName": "Nadya"
}
```

### `POST /api/pos/stock/master`

Mengubah stok master produk.

Contoh body untuk menambah stok:

```json
{
  "productId": 21,
  "addPackQuantity": 1,
  "addLoosePcsQuantity": 10
}
```

Contoh body untuk set total stok:

```json
{
  "productId": 21,
  "setTotalPcs": 60
}
```

### `GET /api/pos/stock/logs?date=YYYY-MM-DD`

Mengambil log stok pada tanggal tertentu.
