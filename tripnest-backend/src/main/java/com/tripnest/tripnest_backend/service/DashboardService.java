package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.dto.*;
import com.tripnest.tripnest_backend.entity.Budget;
import com.tripnest.tripnest_backend.entity.Destination;
import com.tripnest.tripnest_backend.entity.Trip;
import com.tripnest.tripnest_backend.entity.User;
import com.tripnest.tripnest_backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final TripRepository tripRepository;
    private final TripMemberRepository tripMemberRepository;
    private final BudgetRepository budgetRepository;
    private final ExpenseRepository expenseRepository;
    private final DestinationRepository destinationRepository;
    private final NotificationRepository notificationRepository;

    public TravelerDashboardResponse getTravelerDashboard(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + userEmail));

        // 1. Gather all trips where user is owner or approved member
        Map<Integer, Trip> tripMap = new LinkedHashMap<>();
        tripRepository.findByOwnerId(user.getId()).forEach(t -> tripMap.put(t.getId(), t));
        tripMemberRepository.findByUserIdAndStatus(user.getId(), "APPROVED")
                .forEach(tm -> tripMap.putIfAbsent(tm.getTrip().getId(), tm.getTrip()));

        List<Trip> userTrips = new ArrayList<>(tripMap.values());
        LocalDate today = LocalDate.now();

        // Component 1: Upcoming Trips (startDate in future or today, sorted soonest first)
        List<TripResponse> upcomingTrips = userTrips.stream()
                .filter(t -> t.getStartDate() != null && !t.getStartDate().isBefore(today))
                .sorted(Comparator.comparing(Trip::getStartDate))
                .map(this::mapTripToResponse)
                .collect(Collectors.toList());

        // Component 2: Budget Overview (total budgeted vs total spent across user trips)
        BigDecimal totalBudgeted = BigDecimal.ZERO;
        BigDecimal totalSpent = BigDecimal.ZERO;
        Map<String, BigDecimal> categorySpentMap = new HashMap<>();

        for (Trip trip : userTrips) {
            Budget budget = budgetRepository.findByTripId(trip.getId()).orElse(null);
            if (budget != null && budget.getTotalBudget() != null) {
                totalBudgeted = totalBudgeted.add(budget.getTotalBudget());
            }

            BigDecimal tripSpent = expenseRepository.sumAmountByTripId(trip.getId());
            if (tripSpent != null) {
                totalSpent = totalSpent.add(tripSpent);
            }

            List<CategorySummaryDto> tripCatSummaries = expenseRepository.findCategorySummaryByTripId(trip.getId());
            for (CategorySummaryDto catSummary : tripCatSummaries) {
                if (catSummary.getCategory() != null && catSummary.getTotalAmount() != null) {
                    categorySpentMap.put(
                            catSummary.getCategory(),
                            categorySpentMap.getOrDefault(catSummary.getCategory(), BigDecimal.ZERO).add(catSummary.getTotalAmount())
                    );
                }
            }
        }

        TravelerDashboardResponse.BudgetOverview budgetOverview = new TravelerDashboardResponse.BudgetOverview(
                totalBudgeted,
                totalSpent
        );

        // Component 3: Expense Summary (category breakdown across all user trips)
        List<CategorySummaryDto> expenseSummary = new ArrayList<>();
        if (totalSpent.compareTo(BigDecimal.ZERO) > 0) {
            for (Map.Entry<String, BigDecimal> entry : categorySpentMap.entrySet()) {
                double pct = entry.getValue()
                        .multiply(BigDecimal.valueOf(100))
                        .divide(totalSpent, 2, RoundingMode.HALF_UP)
                        .doubleValue();
                expenseSummary.add(new CategorySummaryDto(entry.getKey(), entry.getValue(), pct));
            }
        } else {
            for (Map.Entry<String, BigDecimal> entry : categorySpentMap.entrySet()) {
                expenseSummary.add(new CategorySummaryDto(entry.getKey(), entry.getValue(), 0.0));
            }
        }

        // Component 4: Favorite / Most-Visited Destinations
        Map<Destination, Long> destVisitCount = new HashMap<>();
        for (Trip trip : userTrips) {
            if (trip.getDestination() != null) {
                destVisitCount.put(trip.getDestination(), destVisitCount.getOrDefault(trip.getDestination(), 0L) + 1);
            }
        }

        List<TravelerDashboardResponse.DestinationVisitDto> favoriteDestinations = destVisitCount.entrySet().stream()
                .sorted(Map.Entry.<Destination, Long>comparingByValue().reversed())
                .map(entry -> new TravelerDashboardResponse.DestinationVisitDto(
                        entry.getKey().getId(),
                        entry.getKey().getName(),
                        entry.getKey().getCountry(),
                        entry.getValue()
                ))
                .collect(Collectors.toList());

        // Component 5: Basic Travel Stats
        TravelerDashboardResponse.BasicStats basicStats = new TravelerDashboardResponse.BasicStats(
                userTrips.size(),
                destVisitCount.keySet().size(),
                totalSpent
        );

        return new TravelerDashboardResponse(
                upcomingTrips,
                budgetOverview,
                expenseSummary,
                favoriteDestinations,
                basicStats
        );
    }

    public AdminDashboardResponse getAdminDashboard() {
        // Component 1: User Analytics
        long totalUsers = userRepository.count();

        // Component 2: Trip Analytics
        List<Trip> allTrips = tripRepository.findAll();
        long totalTrips = allTrips.size();
        LocalDate today = LocalDate.now();

        long activeTrips = allTrips.stream()
                .filter(t -> "ACTIVE".equalsIgnoreCase(t.getStatus()) ||
                        ("PLANNED".equalsIgnoreCase(t.getStatus()) && t.getStartDate() != null && !t.getStartDate().isAfter(today)))
                .count();

        long completedTrips = allTrips.stream()
                .filter(t -> "COMPLETED".equalsIgnoreCase(t.getStatus()) ||
                        (t.getEndDate() != null && t.getEndDate().isBefore(today)))
                .count();

        AdminDashboardResponse.UserAnalytics userAnalytics = new AdminDashboardResponse.UserAnalytics(totalUsers);
        AdminDashboardResponse.TripAnalytics tripAnalytics = new AdminDashboardResponse.TripAnalytics(
                totalTrips, activeTrips, completedTrips
        );

        // Component 3: Destination Analytics
        Map<Destination, Long> destTripCounts = new HashMap<>();
        for (Trip t : allTrips) {
            if (t.getDestination() != null) {
                destTripCounts.put(t.getDestination(), destTripCounts.getOrDefault(t.getDestination(), 0L) + 1);
            }
        }

        List<AdminDashboardResponse.DestinationPopularityDto> destinationAnalytics = destTripCounts.entrySet().stream()
                .sorted(Map.Entry.<Destination, Long>comparingByValue().reversed())
                .map(e -> new AdminDashboardResponse.DestinationPopularityDto(
                        e.getKey().getId(),
                        e.getKey().getName(),
                        e.getKey().getCountry(),
                        e.getValue()
                ))
                .collect(Collectors.toList());

        // Component 4: Platform Stats
        BigDecimal totalPlatformExpenses = expenseRepository.findAll().stream()
                .map(e -> e.getAmount() != null ? e.getAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalNotificationsSent = notificationRepository.count();

        AdminDashboardResponse.PlatformStats platformStats = new AdminDashboardResponse.PlatformStats(
                totalPlatformExpenses,
                totalNotificationsSent
        );

        return new AdminDashboardResponse(
                userAnalytics,
                tripAnalytics,
                destinationAnalytics,
                platformStats
        );
    }

    private TripResponse mapTripToResponse(Trip trip) {
        Budget budget = budgetRepository.findByTripId(trip.getId()).orElse(null);
        BigDecimal budgetedAmount = budget != null && budget.getTotalBudget() != null ? budget.getTotalBudget() : BigDecimal.ZERO;

        return new TripResponse(
                trip.getId(),
                trip.getTitle(),
                trip.getOwner().getId(),
                trip.getOwner().getName(),
                trip.getDestination() != null ? trip.getDestination().getId() : null,
                trip.getDestination() != null ? trip.getDestination().getName() : "Custom Destination",
                trip.getDestination() != null ? trip.getDestination().getCountry() : "",
                trip.getStartDate(),
                trip.getEndDate(),
                budgetedAmount,
                trip.getStatus()
        );
    }
}
