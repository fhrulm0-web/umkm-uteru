package com.uteru.pos.payload;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class MasterStockRequest {
    @NotNull
    @Positive
    private Long productId;

    @Min(0)
    @Max(1_000_000)
    private Integer addPackQuantity;

    @Min(0)
    @Max(1_000_000)
    private Integer addLoosePcsQuantity;

    @Min(0)
    @Max(100_000_000)
    private Integer setTotalPcs;

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public Integer getAddPackQuantity() {
        return addPackQuantity;
    }

    public void setAddPackQuantity(Integer addPackQuantity) {
        this.addPackQuantity = addPackQuantity;
    }

    public Integer getAddLoosePcsQuantity() {
        return addLoosePcsQuantity;
    }

    public void setAddLoosePcsQuantity(Integer addLoosePcsQuantity) {
        this.addLoosePcsQuantity = addLoosePcsQuantity;
    }

    public Integer getSetTotalPcs() {
        return setTotalPcs;
    }

    public void setSetTotalPcs(Integer setTotalPcs) {
        this.setTotalPcs = setTotalPcs;
    }
}
