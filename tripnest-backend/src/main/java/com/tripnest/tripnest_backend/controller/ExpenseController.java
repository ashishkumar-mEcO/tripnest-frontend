package com.tripnest.tripnest_backend.controller;

import com.tripnest.tripnest_backend.dto.CategorySummaryDto;
import com.tripnest.tripnest_backend.dto.ExpenseRequest;
import com.tripnest.tripnest_backend.dto.ExpenseResponse;
import com.tripnest.tripnest_backend.service.ExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    @PostMapping("/api/trips/{tripId}/expenses")
    public ResponseEntity<ExpenseResponse> createExpense(
            @PathVariable Integer tripId,
            @Valid @RequestBody ExpenseRequest request,
            Authentication authentication) {
        ExpenseResponse response = expenseService.createExpense(tripId, request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/api/trips/{tripId}/expenses")
    public ResponseEntity<List<ExpenseResponse>> getExpenses(
            @PathVariable Integer tripId,
            Authentication authentication) {
        List<ExpenseResponse> expenses = expenseService.getExpensesByTrip(tripId, authentication.getName());
        return ResponseEntity.ok(expenses);
    }

    @PutMapping("/api/expenses/{id}")
    public ResponseEntity<ExpenseResponse> updateExpense(
            @PathVariable Integer id,
            @Valid @RequestBody ExpenseRequest request,
            Authentication authentication) {
        ExpenseResponse response = expenseService.updateExpense(id, request, authentication.getName());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/api/expenses/{id}")
    public ResponseEntity<Void> deleteExpense(
            @PathVariable Integer id,
            Authentication authentication) {
        expenseService.deleteExpense(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/trips/{tripId}/expenses/category-summary")
    public ResponseEntity<List<CategorySummaryDto>> getCategorySummary(
            @PathVariable Integer tripId,
            Authentication authentication) {
        List<CategorySummaryDto> summary = expenseService.getCategorySummary(tripId, authentication.getName());
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/api/trips/{tripId}/expenses/remaining-budget")
    public ResponseEntity<BigDecimal> getRemainingBudget(
            @PathVariable Integer tripId,
            Authentication authentication) {
        BigDecimal remaining = expenseService.getRemainingBudget(tripId, authentication.getName());
        return ResponseEntity.ok(remaining);
    }
}
