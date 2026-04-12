package com.uteru.pos.models;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "description")
    private String description;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "is_custom_price")
    private Boolean isCustomPrice = false;

    @Column(name = "icon")
    private String icon;

    // Konversi kemasan: packName = "Plastik", pcsPerPack = 25
    @Column(name = "pack_name")
    private String packName;

    @Column(name = "pcs_per_pack")
    private Integer pcsPerPack = 1;

    @Column(name = "track_stock")
    private Boolean trackStock = false;

    @Column(name = "current_stock_pcs")
    private Integer currentStockPcs = 0;

    public Product() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public Boolean getIsCustomPrice() { return isCustomPrice; }
    public void setIsCustomPrice(Boolean isCustomPrice) { this.isCustomPrice = isCustomPrice; }
    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }
    public String getPackName() { return packName; }
    public void setPackName(String packName) { this.packName = packName; }
    public Integer getPcsPerPack() { return pcsPerPack; }
    public void setPcsPerPack(Integer pcsPerPack) { this.pcsPerPack = pcsPerPack; }
    public Boolean getTrackStock() { return trackStock; }
    public void setTrackStock(Boolean trackStock) { this.trackStock = trackStock; }
    public Integer getCurrentStockPcs() { return currentStockPcs; }
    public void setCurrentStockPcs(Integer currentStockPcs) { this.currentStockPcs = currentStockPcs; }
}
