package com.tripnest.tripnest_backend.controller;

import com.tripnest.tripnest_backend.dto.AdminDashboardResponse;
import com.tripnest.tripnest_backend.dto.TravelerDashboardResponse;
import com.tripnest.tripnest_backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    /**
     * Component 1-5 aggregated in ONE API call for Traveler Dashboard
     * GET /api/dashboard/traveler
     */
    @GetMapping("/traveler")
    public ResponseEntity<TravelerDashboardResponse> getTravelerDashboard(Authentication authentication) {
        TravelerDashboardResponse response = dashboardService.getTravelerDashboard(authentication.getName());
        return ResponseEntity.ok(response);
    }

    /**
     * Component 1-4 aggregated in ONE Administrator-only API call for Admin Dashboard
     * GET /api/dashboard/admin
     */
    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<AdminDashboardResponse> getAdminDashboard() {
        AdminDashboardResponse response = dashboardService.getAdminDashboard();
        return ResponseEntity.ok(response);
    }
}
