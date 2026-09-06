package com.tripnest.tripnest_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TravelerDashboardResponse {

    private List<TripResponse> upcomingTrips;
    private BudgetOverview budgetOverview;
    private List<CategorySummaryDto> expenseSummary;
    private List<DestinationVisitDto> favoriteDestinations;
    private BasicStats basicStats;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BudgetOverview {
        private BigDecimal totalBudgeted;
        private BigDecimal totalSpent;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DestinationVisitDto {
        private Integer id;
        private String name;
        private String country;
        private long visitCount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BasicStats {
        private long totalTrips;
        private long totalDestinations;
        private BigDecimal totalSpent;
    }
}
