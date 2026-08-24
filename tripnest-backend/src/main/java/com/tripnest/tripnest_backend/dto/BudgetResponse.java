package com.tripnest.tripnest_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BudgetResponse {
    private Integer id;
    private Integer tripId;
    private String tripTitle;
    private BigDecimal totalBudget;
    private BigDecimal spentAmount;
    private BigDecimal remainingBudget;
    private String currency;
    private String notes;
}
