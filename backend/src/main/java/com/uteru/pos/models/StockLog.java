package com.uteru.pos.models;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "stock_logs",
        uniqueConstraints = @UniqueConstraint(columnNames = {"product_id", "log_date"}))
public class StockLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "log_date", nullable = false)
    private LocalDate logDate;

    @Column(name = "morning_stock")
    private Integer morningStock;

    @Column(name = "night_stock")
    private Integer nightStock;

    @Column(name = "morning_staff_name")
    private String morningStaffName;

    @Column(name = "night_staff_name")
    private String nightStaffName;

    @Column(name = "system_sold_qty")
    private Integer systemSoldQty = 0;

    @Column(name = "actual_used_qty")
    private Integer actualUsedQty;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() { this.updatedAt = LocalDateTime.now(); }

    public StockLog() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }
    public LocalDate getLogDate() { return logDate; }
    public void setLogDate(LocalDate logDate) { this.logDate = logDate; }
    public Integer getMorningStock() { return morningStock; }
    public void setMorningStock(Integer morningStock) { this.morningStock = morningStock; }
    public Integer getNightStock() { return nightStock; }
    public void setNightStock(Integer nightStock) { this.nightStock = nightStock; }
    public String getMorningStaffName() { return morningStaffName; }
    public void setMorningStaffName(String morningStaffName) { this.morningStaffName = morningStaffName; }
    public String getNightStaffName() { return nightStaffName; }
    public void setNightStaffName(String nightStaffName) { this.nightStaffName = nightStaffName; }
    public Integer getSystemSoldQty() { return systemSoldQty; }
    public void setSystemSoldQty(Integer systemSoldQty) { this.systemSoldQty = systemSoldQty; }
    public Integer getActualUsedQty() { return actualUsedQty; }
    public void setActualUsedQty(Integer actualUsedQty) { this.actualUsedQty = actualUsedQty; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
