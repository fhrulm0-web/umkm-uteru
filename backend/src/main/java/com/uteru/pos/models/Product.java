package com.uteru.pos.models;

import com.uteru.pos.validation.NoMarkup;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

@Entity
@Table(name = "products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    @NotBlank
    @Size(max = 120)
    @NoMarkup
    private String name;

    @Column(name = "description", length = 500)
    @Size(max = 500)
    @NoMarkup
    private String description;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(nullable = false)
    @NotNull
    @DecimalMin("0.00")
    @Digits(integer = 12, fraction = 2)
    private BigDecimal price;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "is_custom_price")
    private Boolean isCustomPrice = false;

    @Column(name = "icon")
    @Size(max = 16)
    @NoMarkup
    private String icon;

    // Konversi kemasan: packName = "Plastik", pcsPerPack = 25
    @Column(name = "pack_name", length = 40)
    @Size(max = 40)
    @NoMarkup
    private String packName;

    @Column(name = "pcs_per_pack")
    @Min(1)
    @Max(1_000_000)
    private Integer pcsPerPack = 1;

    @Column(name = "track_stock")
    private Boolean trackStock = false;

    @Column(name = "current_stock_pcs")
    @Min(0)
    @Max(100_000_000)
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
