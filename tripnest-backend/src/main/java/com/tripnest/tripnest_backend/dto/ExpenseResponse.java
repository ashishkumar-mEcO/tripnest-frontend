package com.tripnest.tripnest_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseResponse {
    private Integer id;
    private Integer budgetId;
    private Integer tripId;
    private String category;
    private BigDecimal amount;
    private String description;
    private LocalDate expenseDate;
}
