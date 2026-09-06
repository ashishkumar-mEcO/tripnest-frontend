package com.tripnest.tripnest_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardResponse {

    private UserAnalytics userAnalytics;
    private TripAnalytics tripAnalytics;
    private List<DestinationPopularityDto> destinationAnalytics;
    private PlatformStats platformStats;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserAnalytics {
        private long totalUsers;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TripAnalytics {
        private long totalTrips;
        private long activeTrips;
        private long completedTrips;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DestinationPopularityDto {
        private Integer destinationId;
        private String name;
        private String country;
        private long tripCount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlatformStats {
        private BigDecimal totalPlatformExpenses;
        private long totalNotificationsSent;
    }
}
