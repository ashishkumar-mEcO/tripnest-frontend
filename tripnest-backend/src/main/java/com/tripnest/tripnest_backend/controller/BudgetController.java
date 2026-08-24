package com.tripnest.tripnest_backend.controller;

import com.tripnest.tripnest_backend.dto.BudgetRequest;
import com.tripnest.tripnest_backend.dto.BudgetResponse;
import com.tripnest.tripnest_backend.service.BudgetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/trips/{tripId}/budget")
@RequiredArgsConstructor
public class BudgetController {

    private final BudgetService budgetService;

    @PostMapping
    public ResponseEntity<BudgetResponse> createBudget(
            @PathVariable Integer tripId,
            @Valid @RequestBody BudgetRequest request,
            Authentication authentication) {
        BudgetResponse response = budgetService.createBudget(tripId, request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<BudgetResponse> getBudget(
            @PathVariable Integer tripId,
            Authentication authentication) {
        BudgetResponse response = budgetService.getBudgetByTripId(tripId, authentication.getName());
        return ResponseEntity.ok(response);
    }

    @PutMapping
    public ResponseEntity<BudgetResponse> updateBudget(
            @PathVariable Integer tripId,
            @Valid @RequestBody BudgetRequest request,
            Authentication authentication) {
        BudgetResponse response = budgetService.updateBudget(tripId, request, authentication.getName());
        return ResponseEntity.ok(response);
    }
}
