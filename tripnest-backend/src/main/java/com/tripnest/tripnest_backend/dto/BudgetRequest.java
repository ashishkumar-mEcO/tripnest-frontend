package com.tripnest.tripnest_backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BudgetRequest {

    @NotNull(message = "Total budget is required")
    @DecimalMin(value = "0.00", message = "Total budget cannot be negative")
    private BigDecimal totalBudget;

    @DecimalMin(value = "0.00", message = "Spent amount cannot be negative")
    private BigDecimal spentAmount;

    private String currency;

    private String notes;
}
