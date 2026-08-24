package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.dto.CategorySummaryDto;
import com.tripnest.tripnest_backend.dto.ExpenseRequest;
import com.tripnest.tripnest_backend.dto.ExpenseResponse;
import com.tripnest.tripnest_backend.entity.Budget;
import com.tripnest.tripnest_backend.entity.Expense;
import com.tripnest.tripnest_backend.entity.Trip;
import com.tripnest.tripnest_backend.repository.BudgetRepository;
import com.tripnest.tripnest_backend.repository.ExpenseRepository;
import com.tripnest.tripnest_backend.repository.TripRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final BudgetRepository budgetRepository;
    private final TripRepository tripRepository;

    public ExpenseResponse createExpense(Integer tripId, ExpenseRequest request, String userEmail) {
        Trip trip = verifyTripOwner(tripId, userEmail);

        Budget budget = budgetRepository.findByTripId(tripId)
                .orElseGet(() -> {
                    Budget b = new Budget();
                    b.setTrip(trip);
                    b.setTotalBudget(BigDecimal.ZERO);
                    b.setSpentAmount(BigDecimal.ZERO);
                    return budgetRepository.save(b);
                });

        Expense expense = new Expense();
        expense.setBudget(budget);
        expense.setCategory(request.getCategory());
        expense.setAmount(request.getAmount());
        expense.setDescription(request.getDescription());
        expense.setExpenseDate(request.getExpenseDate());

        Expense saved = expenseRepository.save(expense);
        recalculateBudget(budget.getId());

        return mapToResponse(saved);
    }

    public List<ExpenseResponse> getExpensesByTrip(Integer tripId, String userEmail) {
        verifyTripOwner(tripId, userEmail);
        return expenseRepository.findByBudgetTripIdOrderByExpenseDateDesc(tripId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ExpenseResponse updateExpense(Integer expenseId, ExpenseRequest request, String userEmail) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Expense not found with id: " + expenseId));

        verifyTripOwner(expense.getBudget().getTrip().getId(), userEmail);

        expense.setCategory(request.getCategory());
        expense.setAmount(request.getAmount());
        expense.setDescription(request.getDescription());
        if (request.getExpenseDate() != null) {
            expense.setExpenseDate(request.getExpenseDate());
        }

        Expense updated = expenseRepository.save(expense);
        recalculateBudget(expense.getBudget().getId());

        return mapToResponse(updated);
    }

    public void deleteExpense(Integer expenseId, String userEmail) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Expense not found with id: " + expenseId));

        Integer budgetId = expense.getBudget().getId();
        verifyTripOwner(expense.getBudget().getTrip().getId(), userEmail);

        expenseRepository.delete(expense);
        recalculateBudget(budgetId);
    }

    public List<CategorySummaryDto> getCategorySummary(Integer tripId, String userEmail) {
        verifyTripOwner(tripId, userEmail);
        return expenseRepository.findCategorySummaryByTripId(tripId);
    }

    public BigDecimal getRemainingBudget(Integer tripId, String userEmail) {
        verifyTripOwner(tripId, userEmail);
        Budget budget = budgetRepository.findByTripId(tripId).orElse(null);
        if (budget == null) {
            return BigDecimal.ZERO;
        }
        BigDecimal totalSpent = expenseRepository.sumAmountByTripId(tripId);
        if (totalSpent == null) {
            totalSpent = BigDecimal.ZERO;
        }
        return budget.getTotalBudget().subtract(totalSpent);
    }

    private void recalculateBudget(Integer budgetId) {
        Budget budget = budgetRepository.findById(budgetId).orElse(null);
        if (budget != null) {
            BigDecimal totalSpent = expenseRepository.sumAmountByBudgetId(budgetId);
            if (totalSpent == null) {
                totalSpent = BigDecimal.ZERO;
            }
            budget.setSpentAmount(totalSpent);
            budgetRepository.save(budget);
        }
    }

    private Trip verifyTripOwner(Integer tripId, String userEmail) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Trip not found with id: " + tripId));

        if (!trip.getOwner().getEmail().equalsIgnoreCase(userEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to access expenses for this trip");
        }
        return trip;
    }

    private ExpenseResponse mapToResponse(Expense e) {
        return new ExpenseResponse(
                e.getId(),
                e.getBudget().getId(),
                e.getBudget().getTrip().getId(),
                e.getCategory(),
                e.getAmount(),
                e.getDescription(),
                e.getExpenseDate()
        );
    }
}
