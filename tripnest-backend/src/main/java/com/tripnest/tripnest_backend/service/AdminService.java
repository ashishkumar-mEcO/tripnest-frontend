package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.dto.TripResponse;
import com.tripnest.tripnest_backend.dto.UserSummaryResponse;
import com.tripnest.tripnest_backend.entity.Budget;
import com.tripnest.tripnest_backend.entity.Role;
import com.tripnest.tripnest_backend.entity.User;
import com.tripnest.tripnest_backend.repository.BudgetRepository;
import com.tripnest.tripnest_backend.repository.RoleRepository;
import com.tripnest.tripnest_backend.repository.TripRepository;
import com.tripnest.tripnest_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final TripRepository tripRepository;
    private final BudgetRepository budgetRepository;

    public List<UserSummaryResponse> listUsers() {
        return userRepository.findAll().stream()
                .map(u -> new UserSummaryResponse(u.getId(), u.getName(), u.getEmail(), u.getRole() != null ? u.getRole().getName() : "USER"))
                .toList();
    }

    public List<TripResponse> listTrips() {
        return tripRepository.findAll().stream()
                .map(t -> {
                    Integer destId = t.getDestination() != null ? t.getDestination().getId() : null;
                    String destName = t.getDestination() != null ? t.getDestination().getName() : null;
                    String destCountry = t.getDestination() != null ? t.getDestination().getCountry() : null;
                    BigDecimal budgetAmount = budgetRepository.findByTripId(t.getId())
                            .map(Budget::getTotalBudget)
                            .orElse(BigDecimal.ZERO);
                    return new TripResponse(
                            t.getId(),
                            t.getTitle(),
                            t.getOwner() != null ? t.getOwner().getId() : null,
                            t.getOwner() != null ? t.getOwner().getName() : "Unknown",
                            destId,
                            destName,
                            destCountry,
                            t.getStartDate(),
                            t.getEndDate(),
                            budgetAmount,
                            t.getStatus()
                    );
                })
                .toList();
    }

    public UserSummaryResponse updateUserRole(Integer userId, String roleName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        Role newRole = roleRepository.findByName(roleName.toUpperCase())
                .orElseThrow(() -> new RuntimeException("Role does not exist: " + roleName));

        user.setRole(newRole);
        User savedUser = userRepository.save(user);

        return new UserSummaryResponse(savedUser.getId(), savedUser.getName(), savedUser.getEmail(), savedUser.getRole() != null ? savedUser.getRole().getName() : "USER");
    }
}
