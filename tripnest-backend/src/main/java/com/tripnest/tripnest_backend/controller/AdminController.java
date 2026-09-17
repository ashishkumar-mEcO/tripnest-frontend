package com.tripnest.tripnest_backend.controller;
 
import com.tripnest.tripnest_backend.dto.TripResponse;
import com.tripnest.tripnest_backend.dto.UpdateRoleRequest;
import com.tripnest.tripnest_backend.dto.UserSummaryResponse;
import com.tripnest.tripnest_backend.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
 
import java.util.List;
 
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMINISTRATOR')")
public class AdminController {
 
    private final AdminService adminService;
 
    @GetMapping("/dashboard")
    public String adminDashboard(Authentication authentication) {
        return "Welcome, Administrator " + authentication.getName() + "! This is the admin-only dashboard.";
    }
 
    @GetMapping("/users")
    public List<UserSummaryResponse> listUsers() {
        return adminService.listUsers();
    }
 
    @GetMapping("/trips")
    public List<TripResponse> listTrips() {
        return adminService.listTrips();
    }
 
    @PutMapping("/users/{id}/role")
    public UserSummaryResponse updateUserRole(@PathVariable Integer id, @Valid @RequestBody UpdateRoleRequest request) {
        return adminService.updateUserRole(id, request.getRoleName());
    }
}
