package com.uteru.pos.payload;

import com.uteru.pos.validation.NoMarkup;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public class StockInputRequest {
    @NotNull
    @Positive
    private Long productId;

    @Min(0)
    @Max(1_000_000)
    private Integer packQuantity;

    @Min(0)
    @Max(1_000_000)
    private Integer loosePcsQuantity;

    @NotBlank
    @Size(max = 120)
    @NoMarkup
    private String staffName;

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public Integer getPackQuantity() {
        return packQuantity;
    }

    public void setPackQuantity(Integer packQuantity) {
        this.packQuantity = packQuantity;
    }

    public Integer getLoosePcsQuantity() {
        return loosePcsQuantity;
    }

    public void setLoosePcsQuantity(Integer loosePcsQuantity) {
        this.loosePcsQuantity = loosePcsQuantity;
    }

    public String getStaffName() {
        return staffName;
    }

    public void setStaffName(String staffName) {
        this.staffName = staffName;
    }
}
