package com.tripnest.tripnest_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategorySummaryDto {
    private String category;
    private BigDecimal totalAmount;
    private Double percentage;

    public CategorySummaryDto(String category, BigDecimal totalAmount) {
        this.category = category;
        this.totalAmount = totalAmount;
        this.percentage = 0.0;
    }
}
