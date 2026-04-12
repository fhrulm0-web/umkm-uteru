package com.uteru.pos.payload;

public class StockInputRequest {
    private Long productId;
    private Integer packQuantity;
    private Integer loosePcsQuantity;
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
