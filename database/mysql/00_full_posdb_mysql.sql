SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP DATABASE IF EXISTS posdb;
CREATE DATABASE posdb
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE posdb;

CREATE TABLE categories (
  id BIGINT NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE products (
  id BIGINT NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description VARCHAR(255) NULL,
  category_id BIGINT NULL,
  price DECIMAL(19,2) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  is_custom_price TINYINT(1) NOT NULL DEFAULT 0,
  icon VARCHAR(255) NULL,
  pack_name VARCHAR(255) NULL,
  pcs_per_pack INT NULL DEFAULT 1,
  track_stock TINYINT(1) NOT NULL DEFAULT 0,
  current_stock_pcs INT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_products_category_id (category_id),
  CONSTRAINT fk_products_category
    FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pos_users (
  id BIGINT NOT NULL AUTO_INCREMENT,
  username VARCHAR(255) NOT NULL,
  email VARCHAR(255) NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  avatar VARCHAR(255) NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uk_pos_users_username (username),
  UNIQUE KEY uk_pos_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE transactions (
  id BIGINT NOT NULL AUTO_INCREMENT,
  transaction_code VARCHAR(255) NULL,
  transaction_date DATETIME(6) NOT NULL,
  cashier_name VARCHAR(255) NULL,
  payment_method VARCHAR(50) NOT NULL,
  total_amount DECIMAL(19,2) NOT NULL,
  amount_paid DECIMAL(19,2) NULL,
  change_amount DECIMAL(19,2) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_transactions_transaction_code (transaction_code),
  KEY idx_transactions_transaction_date (transaction_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE transaction_details (
  id BIGINT NOT NULL AUTO_INCREMENT,
  transaction_id BIGINT NOT NULL,
  product_id BIGINT NULL,
  product_name VARCHAR(255) NULL,
  quantity INT NOT NULL,
  price_at_time DECIMAL(19,2) NOT NULL,
  subtotal DECIMAL(19,2) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_transaction_details_transaction_id (transaction_id),
  KEY idx_transaction_details_product_id (product_id),
  CONSTRAINT fk_transaction_details_transaction
    FOREIGN KEY (transaction_id) REFERENCES transactions(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_transaction_details_product
    FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE stock_logs (
  id BIGINT NOT NULL AUTO_INCREMENT,
  product_id BIGINT NOT NULL,
  log_date DATE NOT NULL,
  morning_stock INT NULL,
  night_stock INT NULL,
  morning_staff_name VARCHAR(255) NULL,
  night_staff_name VARCHAR(255) NULL,
  system_sold_qty INT NULL DEFAULT 0,
  actual_used_qty INT NULL,
  created_at DATETIME(6) NULL,
  updated_at DATETIME(6) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_stock_logs_product_date (product_id, log_date),
  KEY idx_stock_logs_log_date (log_date),
  CONSTRAINT fk_stock_logs_product
    FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO categories (id, name) VALUES
  (1, 'Minuman'),
  (2, 'Makanan');

INSERT INTO products (
  id, name, description, category_id, price, is_active, is_custom_price,
  icon, pack_name, pcs_per_pack, track_stock, current_stock_pcs
) VALUES
  (1, 'Es Kelapa Plastik', 'Pilih varian gula putih, aren, atau sirup', 1, 6000.00, 1, 0, NULL, NULL, 1, 0, 0),
  (2, 'Es Kelapa Cup Kecil', 'Pilih varian gula putih, aren, atau sirup', 1, 6000.00, 1, 0, NULL, NULL, 1, 0, 0),
  (3, 'Es Kelapa Cup Besar', 'Pilih varian gula putih, aren, atau sirup', 1, 10000.00, 1, 0, NULL, NULL, 1, 0, 0),
  (4, 'Es Jeruk Cup Besar', 'Segar dingin', 1, 10000.00, 1, 0, NULL, NULL, 1, 0, 0),
  (5, 'Es Jeruk Cup Kecil', 'Segar dingin', 1, 5000.00, 1, 0, NULL, NULL, 1, 0, 0),
  (6, 'Es Teh Cup Besar', 'Teh manis dingin', 1, 5000.00, 1, 0, NULL, NULL, 1, 0, 0),
  (7, 'Es Teh Cup Kecil', 'Teh manis dingin', 1, 3000.00, 1, 0, NULL, NULL, 1, 0, 0),
  (21, 'Pentol Kuah', 'Harga custom', 2, 0.00, 1, 1, NULL, 'Plastik', 60, 1, 44),
  (22, 'Pentol', 'Harga custom', 2, 0.00, 1, 1, NULL, 'Plastik', 60, 1, 102),
  (23, 'Pentol Goreng', 'Harga custom', 2, 0.00, 1, 1, NULL, 'Plastik', 20, 1, 28),
  (24, 'Pentol Telur', 'Harga custom', 2, 0.00, 1, 1, NULL, 'Plastik', 40, 1, 34),
  (25, 'Sempol', 'Harga custom', 2, 0.00, 1, 1, NULL, 'Plastik', 30, 1, 45),
  (26, 'Tahu Isi', 'Harga custom', 2, 0.00, 1, 1, NULL, 'Plastik', 25, 1, 0),
  (27, 'Siomay', 'Harga custom', 2, 0.00, 1, 1, NULL, 'Plastik', 16, 1, 0),
  (28, 'Pentol Besar', 'Harga custom', 2, 0.00, 1, 1, NULL, 'Plastik', 8, 1, 0),
  (30, 'Kelapa Bijian', 'Harga custom', 1, 0.00, 1, 1, NULL, NULL, 1, 0, 0);

INSERT INTO pos_users (
  id, username, email, name, role, avatar, password_hash, is_active
) VALUES
  (1, 'owner', 'owner@uteru.local', 'Owner', 'owner', 'O', 'pbkdf2_sha256$60000$dXRlcnUtb3duZXItc2FsdA==$j1/NnPqfAMh0F06YUaG/QODKM7Lal+3NInPvzIhAAiA=', 1),
  (2, 'staff1', 'staff1@uteru.local', 'Bu Rani', 'staff', 'R', 'pbkdf2_sha256$60000$dXRlcnUtc3RhZmYxLXNhbHQ=$riOx4RXBbpqf5IkHYFrMbFteLSTPYIfz/pJ6mzUL92Y=', 1),
  (3, 'staff2', 'staff2@uteru.local', 'Nadya', 'staff', 'N', 'pbkdf2_sha256$60000$dXRlcnUtc3RhZmYyLXNhbHQ=$WPXtuySbfgc0FkMd4OiXLSDC5PvxEPOqt0O/xOkeDME=', 1);

INSERT INTO transactions (
  id, transaction_code, transaction_date, cashier_name, payment_method,
  total_amount, amount_paid, change_amount
) VALUES
  (1, NULL, '2026-04-04 17:53:19.179455', NULL, 'CASH', 6000.00, 6000.00, NULL),
  (2, NULL, '2026-04-04 17:56:52.318202', NULL, 'QRIS', 30000.00, 30000.00, NULL),
  (3, NULL, '2026-04-04 18:05:15.698514', NULL, 'TRANSFER', 20000.00, 20000.00, NULL),
  (4, NULL, '2026-04-04 18:22:59.157765', NULL, 'CASH', 28000.00, 28000.00, NULL),
  (5, NULL, '2026-04-04 19:42:04.603478', NULL, 'CASH', 10000.00, 10000.00, NULL),
  (35, 'TX-4A3DEBD0', '2026-04-05 08:57:49.024859', 'Owner', 'CASH', 60000.00, 60000.00, 0.00),
  (36, 'TX-D6A5B1BE', '2026-04-05 09:00:53.046222', 'Staff 2 (Nadya)', 'CASH', 30000.00, 30000.00, 0.00),
  (37, 'TX-1D285EE3', '2026-04-05 09:03:07.469528', 'Owner', 'CASH', 18000.00, 18000.00, 0.00),
  (38, 'TX-9C7A81A9', '2026-04-05 09:04:32.741674', 'Owner', 'TRANSFER', 80000.00, 80000.00, 0.00),
  (39, 'TX-DEMO-0004', '2026-04-06 08:10:00.000000', 'Owner', 'CASH', 6000.00, 6000.00, 0.00),
  (40, 'TX-DEMO-0005', '2026-04-06 08:12:00.000000', 'Owner', 'CASH', 6000.00, 6000.00, 0.00);

INSERT INTO transaction_details (
  id, transaction_id, product_id, product_name, quantity, price_at_time, subtotal
) VALUES
  (1, 1, 1, NULL, 1, 6000.00, 6000.00),
  (2, 2, 3, NULL, 1, 10000.00, 10000.00),
  (3, 2, 2, NULL, 1, 6000.00, 6000.00),
  (4, 2, 1, NULL, 1, 6000.00, 6000.00),
  (5, 2, 5, NULL, 1, 5000.00, 5000.00),
  (6, 2, 7, NULL, 1, 3000.00, 3000.00),
  (7, 3, 22, 'Pentol', 1, 20000.00, 20000.00),
  (8, 4, NULL, 'Es Jeruk Cup Besar', 1, 10000.00, 10000.00),
  (9, 4, NULL, 'Es Kelapa Cup Kecil (Aren)', 3, 6000.00, 18000.00),
  (10, 5, NULL, 'Es Jeruk Cup Besar', 1, 10000.00, 10000.00),
  (37, 35, 1, 'Es Kelapa Plastik (Aren)', 4, 6000.00, 24000.00),
  (38, 35, 1, 'Es Kelapa Plastik (Gula Putih)', 3, 6000.00, 18000.00),
  (39, 35, 1, 'Es Kelapa Plastik (Sirup)', 3, 6000.00, 18000.00),
  (40, 36, 30, 'Kelapa Bijian', 1, 18000.00, 18000.00),
  (41, 36, 24, 'Pentol Telur', 1, 5000.00, 5000.00),
  (42, 36, 23, 'Pentol Goreng', 1, 7000.00, 7000.00),
  (43, 37, 30, 'Kelapa Bijian', 1, 18000.00, 18000.00),
  (44, 38, 3, 'Es Kelapa Cup Besar (Aren)', 8, 10000.00, 80000.00),
  (45, 39, 7, 'Es Teh Cup Kecil', 2, 3000.00, 6000.00),
  (46, 40, 7, 'Es Teh Cup Kecil', 2, 3000.00, 6000.00);

INSERT INTO stock_logs (
  id, product_id, log_date, morning_stock, night_stock, morning_staff_name,
  night_staff_name, system_sold_qty, actual_used_qty, created_at, updated_at
) VALUES
  (3001, 21, '2026-04-05', 60, 44, 'Bu Rani', 'Nadya', 0, 16, '2026-04-05 08:00:00', '2026-04-05 20:00:00'),
  (3002, 23, '2026-04-05', 40, 28, 'Bu Rani', 'Nadya', 0, 12, '2026-04-05 08:00:00', '2026-04-05 20:00:00'),
  (3003, 24, '2026-04-05', 40, 34, 'Bu Rani', 'Nadya', 0, 6, '2026-04-05 08:00:00', '2026-04-05 20:00:00'),
  (3004, 22, '2026-04-06', 120, 102, 'Bu Rani', 'Nadya', 0, 18, '2026-04-06 08:00:00', '2026-04-06 20:00:00'),
  (3005, 25, '2026-04-06', 60, 45, 'Bu Rani', 'Nadya', 0, 15, '2026-04-06 08:00:00', '2026-04-06 20:00:00');

CREATE OR REPLACE VIEW vw_sales_summary AS
SELECT
  t.id,
  t.transaction_code,
  t.transaction_date,
  t.cashier_name,
  t.payment_method,
  t.total_amount,
  COUNT(td.id) AS item_count
FROM transactions t
LEFT JOIN transaction_details td ON td.transaction_id = t.id
GROUP BY
  t.id, t.transaction_code, t.transaction_date, t.cashier_name, t.payment_method, t.total_amount;

CREATE OR REPLACE VIEW vw_product_sales AS
SELECT
  COALESCE(td.product_name, p.name, 'Produk') AS product_name,
  SUM(td.quantity) AS total_qty,
  SUM(td.subtotal) AS total_revenue
FROM transaction_details td
LEFT JOIN products p ON p.id = td.product_id
GROUP BY COALESCE(td.product_name, p.name, 'Produk');

CREATE OR REPLACE VIEW vw_stock_daily_usage AS
SELECT
  s.log_date,
  p.name AS product_name,
  s.morning_stock,
  s.night_stock,
  s.actual_used_qty,
  s.morning_staff_name,
  s.night_staff_name
FROM stock_logs s
JOIN products p ON p.id = s.product_id;

ALTER TABLE categories AUTO_INCREMENT = 3;
ALTER TABLE products AUTO_INCREMENT = 31;
ALTER TABLE pos_users AUTO_INCREMENT = 4;
ALTER TABLE transactions AUTO_INCREMENT = 41;
ALTER TABLE transaction_details AUTO_INCREMENT = 47;
ALTER TABLE stock_logs AUTO_INCREMENT = 3006;

SET FOREIGN_KEY_CHECKS = 1;
