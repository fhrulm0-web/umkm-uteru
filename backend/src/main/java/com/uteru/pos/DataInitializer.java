package com.uteru.pos;

import org.springframework.boot.CommandLineRunner;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class DataInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    public DataInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        upsertCategory(1L, "Minuman");
        upsertCategory(2L, "Makanan");
        disableLegacyProduct(20L);

        upsertProduct(1L, "Es Kelapa Plastik", "Pilih varian gula putih, aren, atau sirup", 1L,
                6000, false, false, null, 1);
        upsertProduct(2L, "Es Kelapa Cup Kecil", "Pilih varian gula putih, aren, atau sirup", 1L,
                6000, false, false, null, 1);
        upsertProduct(3L, "Es Kelapa Cup Besar", "Pilih varian gula putih, aren, atau sirup", 1L,
                10000, false, false, null, 1);
        upsertProduct(4L, "Es Jeruk Cup Besar", "Segar dingin", 1L,
                10000, false, false, null, 1);
        upsertProduct(5L, "Es Jeruk Cup Kecil", "Segar dingin", 1L,
                5000, false, false, null, 1);
        upsertProduct(6L, "Es Teh Cup Besar", "Teh manis dingin", 1L,
                5000, false, false, null, 1);
        upsertProduct(7L, "Es Teh Cup Kecil", "Teh manis dingin", 1L,
                3000, false, false, null, 1);
        upsertProduct(21L, "Pentol Kuah", "Harga custom", 2L,
                0, true, true, "Plastik", 60);
        upsertProduct(22L, "Pentol", "Harga custom", 2L,
                0, true, true, "Plastik", 60);
        upsertProduct(23L, "Pentol Goreng", "Harga custom", 2L,
                0, true, true, "Plastik", 20);
        upsertProduct(24L, "Pentol Telur", "Harga custom", 2L,
                0, true, true, "Plastik", 40);
        upsertProduct(25L, "Sempol", "Harga custom", 2L,
                0, true, true, "Plastik", 30);
        upsertProduct(26L, "Tahu Isi", "Harga custom", 2L,
                0, true, true, "Plastik", 25);
        upsertProduct(27L, "Siomay", "Harga custom", 2L,
                0, true, true, "Plastik", 16);
        upsertProduct(28L, "Pentol Besar", "Harga custom", 2L,
                0, true, true, "Plastik", 8);
        upsertProduct(30L, "Kelapa Bijian", "Harga custom", 1L,
                0, false, true, null, 1);
    }

    private void upsertCategory(Long id, String name) {
        int updated = jdbcTemplate.update(
                "UPDATE categories SET name = ? WHERE id = ?",
                name,
                id);

        if (updated == 0) {
            jdbcTemplate.update(
                    "INSERT INTO categories (id, name) VALUES (?, ?)",
                    id,
                    name);
        }
    }

    private void upsertProduct(Long id,
                               String name,
                               String description,
                               Long categoryId,
                               int price,
                               boolean trackStock,
                               boolean customPrice,
                               String packName,
                               int pcsPerPack) {
        Integer currentStockPcs = getExistingCurrentStock(id);

        int updated = jdbcTemplate.update("""
                UPDATE products
                SET name = ?, description = ?, category_id = ?, price = ?, is_active = ?, is_custom_price = ?,
                    icon = ?, pack_name = ?, pcs_per_pack = ?, track_stock = ?, current_stock_pcs = ?
                WHERE id = ?
                """,
                name,
                description,
                categoryId,
                BigDecimal.valueOf(price),
                true,
                customPrice,
                null,
                packName,
                pcsPerPack,
                trackStock,
                currentStockPcs == null ? 0 : currentStockPcs,
                id);

        if (updated == 0) {
            jdbcTemplate.update("""
                    INSERT INTO products (
                        id, name, description, category_id, price, is_active, is_custom_price,
                        icon, pack_name, pcs_per_pack, track_stock, current_stock_pcs
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    id,
                    name,
                    description,
                    categoryId,
                    BigDecimal.valueOf(price),
                    true,
                    customPrice,
                    null,
                    packName,
                    pcsPerPack,
                    trackStock,
                    currentStockPcs == null ? 0 : currentStockPcs);
        }
    }

    private Integer getExistingCurrentStock(Long productId) {
        try {
            return jdbcTemplate.queryForObject(
                    "SELECT current_stock_pcs FROM products WHERE id = ?",
                    Integer.class,
                    productId);
        } catch (EmptyResultDataAccessException ex) {
            return 0;
        }
    }

    private void disableLegacyProduct(Long productId) {
        jdbcTemplate.update("UPDATE products SET is_active = FALSE WHERE id = ?", productId);
    }
}
