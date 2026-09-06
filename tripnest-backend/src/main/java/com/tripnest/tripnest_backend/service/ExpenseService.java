package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.dto.CategorySummaryDto;
import com.tripnest.tripnest_backend.dto.ExpenseRequest;
import com.tripnest.tripnest_backend.dto.ExpenseResponse;
import com.tripnest.tripnest_backend.entity.Budget;
import com.tripnest.tripnest_backend.entity.Expense;
import com.tripnest.tripnest_backend.entity.Trip;
import com.tripnest.tripnest_backend.entity.User;
import com.tripnest.tripnest_backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final BudgetRepository budgetRepository;
    private final TripRepository tripRepository;
    private final TripMemberRepository tripMemberRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;
    private final TripAccessService tripAccessService;

    public ExpenseResponse createExpense(Integer tripId, ExpenseRequest request, String userEmail) {
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
        tripAccessService.verifyAccess(tripId, userEmail);
        return expenseRepository.findByBudgetTripIdOrderByExpenseDateDesc(tripId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ExpenseResponse updateExpense(Integer expenseId, ExpenseRequest request, String userEmail) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Expense not found with id: " + expenseId));

        tripAccessService.verifyAccess(expense.getBudget().getTrip().getId(), userEmail);

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
        tripAccessService.verifyAccess(expense.getBudget().getTrip().getId(), userEmail);

        expenseRepository.delete(expense);
        recalculateBudget(budgetId);
    }

    public List<CategorySummaryDto> getCategorySummary(Integer tripId, String userEmail) {
        tripAccessService.verifyAccess(tripId, userEmail);
        return expenseRepository.findCategorySummaryByTripId(tripId);
    }

    public BigDecimal getRemainingBudget(Integer tripId, String userEmail) {
        tripAccessService.verifyAccess(tripId, userEmail);
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
            Budget savedBudget = budgetRepository.save(budget);
            checkBudgetAlertThresholds(savedBudget);
        }
    }

    private void checkBudgetAlertThresholds(Budget budget) {
        if (budget == null || budget.getTrip() == null || budget.getTotalBudget() == null) return;
        if (budget.getTotalBudget().compareTo(BigDecimal.ZERO) <= 0) return;

        BigDecimal totalBudget = budget.getTotalBudget();
        BigDecimal totalSpent = budget.getSpentAmount() != null ? budget.getSpentAmount() : BigDecimal.ZERO;

        double percentage = totalSpent.multiply(BigDecimal.valueOf(100))
                .divide(totalBudget, 2, RoundingMode.HALF_UP)
                .doubleValue();

        Trip trip = budget.getTrip();
        List<User> recipients = new ArrayList<>();
        if (trip.getOwner() != null) recipients.add(trip.getOwner());
        tripMemberRepository.findByTripIdAndStatus(trip.getId(), "APPROVED").forEach(tm -> {
            if (tm.getUser() != null && !recipients.contains(tm.getUser())) {
                recipients.add(tm.getUser());
            }
        });

        // 80% threshold alert
        if (percentage >= 80.0) {
            String key80 = "80% of your trip budget for '" + trip.getTitle() + "'";
            String msg80 = "Budget Alert: You have used 80% of your trip budget for '" + trip.getTitle() + "'!";
            for (User user : recipients) {
                if (!notificationRepository.existsByRecipientIdAndMessageContaining(user.getId(), key80)) {
                    notificationService.createNotification(user, msg80, "BUDGET_ALERT");
                }
            }
        }

        // 100% threshold alert
        if (percentage >= 100.0) {
            String key100 = "100% of your trip budget for '" + trip.getTitle() + "'";
            String msg100 = "Budget Warning: You have reached 100% of your trip budget for '" + trip.getTitle() + "'!";
            for (User user : recipients) {
                if (!notificationRepository.existsByRecipientIdAndMessageContaining(user.getId(), key100)) {
                    notificationService.createNotification(user, msg100, "BUDGET_ALERT");
                }
            }
        }
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
