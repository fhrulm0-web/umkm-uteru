package com.uteru.pos.payload;

public class MasterStockRequest {
    private Long productId;
    private Integer addPackQuantity;
    private Integer addLoosePcsQuantity;
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
