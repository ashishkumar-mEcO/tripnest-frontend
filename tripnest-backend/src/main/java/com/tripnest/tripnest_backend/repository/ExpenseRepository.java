package com.tripnest.tripnest_backend.repository;

import com.tripnest.tripnest_backend.dto.CategorySummaryDto;
import com.tripnest.tripnest_backend.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Integer> {

    List<Expense> findByBudgetIdOrderByExpenseDateDesc(Integer budgetId);

    List<Expense> findByBudgetTripIdOrderByExpenseDateDesc(Integer tripId);

    @Query("SELECT new com.tripnest.tripnest_backend.dto.CategorySummaryDto(e.category, SUM(e.amount)) " +
           "FROM Expense e WHERE e.budget.trip.id = :tripId GROUP BY e.category")
    List<CategorySummaryDto> findCategorySummaryByTripId(@Param("tripId") Integer tripId);

    @Query("SELECT SUM(e.amount) FROM Expense e WHERE e.budget.trip.id = :tripId")
    BigDecimal sumAmountByTripId(@Param("tripId") Integer tripId);

    @Query("SELECT SUM(e.amount) FROM Expense e WHERE e.budget.id = :budgetId")
    BigDecimal sumAmountByBudgetId(@Param("budgetId") Integer budgetId);
}
