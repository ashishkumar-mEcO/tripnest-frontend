package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.dto.BudgetRequest;
import com.tripnest.tripnest_backend.dto.BudgetResponse;
import com.tripnest.tripnest_backend.entity.Budget;
import com.tripnest.tripnest_backend.entity.Trip;
import com.tripnest.tripnest_backend.repository.BudgetRepository;
import com.tripnest.tripnest_backend.repository.TripRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final TripRepository tripRepository;
    private final TripAccessService tripAccessService;

    public BudgetResponse createBudget(Integer tripId, BudgetRequest request, String userEmail) {
        tripAccessService.verifyAccess(tripId, userEmail);
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Trip not found with id: " + tripId));

        Budget budget = budgetRepository.findByTripId(tripId).orElse(null);
        if (budget == null) {
            budget = new Budget();
            budget.setTrip(trip);
            budget.setSpentAmount(request.getSpentAmount() != null ? request.getSpentAmount() : BigDecimal.ZERO);
            budget.setCurrency("INR");
        }

        budget.setTotalBudget(request.getTotalBudget());
        Budget saved = budgetRepository.save(budget);
        return mapToResponse(saved);
    }

    public BudgetResponse updateBudget(Integer tripId, BudgetRequest request, String userEmail) {
        tripAccessService.verifyAccess(tripId, userEmail);
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Trip not found with id: " + tripId));

        Budget budget = budgetRepository.findByTripId(tripId).orElse(null);
        if (budget == null) {
            budget = new Budget();
            budget.setTrip(trip);
            budget.setSpentAmount(BigDecimal.ZERO);
            budget.setCurrency("INR");
        }

        if (request.getTotalBudget() != null) {
            budget.setTotalBudget(request.getTotalBudget());
        }
        if (request.getSpentAmount() != null) {
            budget.setSpentAmount(request.getSpentAmount());
        }

        Budget updated = budgetRepository.save(budget);
        return mapToResponse(updated);
    }

    public BudgetResponse getBudgetByTripId(Integer tripId, String userEmail) {
        tripAccessService.verifyAccess(tripId, userEmail);
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Trip not found with id: " + tripId));

        Budget budget = budgetRepository.findByTripId(tripId)
                .orElseGet(() -> {
                    Budget b = new Budget();
                    b.setTrip(trip);
                    b.setTotalBudget(BigDecimal.ZERO);
                    b.setSpentAmount(BigDecimal.ZERO);
                    b.setCurrency("INR");
                    return budgetRepository.save(b);
                });

        return mapToResponse(budget);
    }

    private BudgetResponse mapToResponse(Budget b) {
        BigDecimal total = b.getTotalBudget() != null ? b.getTotalBudget() : BigDecimal.ZERO;
        BigDecimal spent = b.getSpentAmount() != null ? b.getSpentAmount() : BigDecimal.ZERO;
        BigDecimal remaining = b.getRemainingAmount() != null ? b.getRemainingAmount() : total.subtract(spent);

        return new BudgetResponse(
                b.getId(),
                b.getTrip().getId(),
                b.getTrip().getTitle(),
                total,
                spent,
                remaining,
                "INR",
                "Trip Budget"
        );
    }
}
