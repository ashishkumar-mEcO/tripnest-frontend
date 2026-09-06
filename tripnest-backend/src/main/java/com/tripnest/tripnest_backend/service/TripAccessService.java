package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.entity.Trip;
import com.tripnest.tripnest_backend.entity.TripMember;
import com.tripnest.tripnest_backend.entity.User;
import com.tripnest.tripnest_backend.repository.TripMemberRepository;
import com.tripnest.tripnest_backend.repository.TripRepository;
import com.tripnest.tripnest_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TripAccessService {

    private final TripRepository tripRepository;
    private final UserRepository userRepository;
    private final TripMemberRepository tripMemberRepository;

    /**
     * Single reusable access check: Determines whether a user is allowed to access/view a trip.
     * Allowed if:
     * 1. User is the Trip Owner
     * 2. User is a System Administrator
     * 3. User is an Approved Member of the trip
     */
    public boolean isUserAllowedToAccessTrip(Integer tripId, String userEmail) {
        Trip trip = tripRepository.findById(tripId).orElse(null);
        if (trip == null) return false;

        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (user == null) return false;

        // 1. Trip Owner access
        if (trip.getOwner().getId().equals(user.getId())) {
            return true;
        }

        // 2. System Administrator access
        if (user.getRole() != null && "ADMINISTRATOR".equalsIgnoreCase(user.getRole().getName())) {
            return true;
        }

        // 3. Approved Trip Member access
        return tripMemberRepository.existsByTripIdAndUserEmailAndStatus(tripId, userEmail, "APPROVED");
    }

    /**
     * Reusable check to determine if user is Group Admin or Trip Owner
     */
    public boolean isGroupAdminOrOwner(Integer tripId, String userEmail) {
        Trip trip = tripRepository.findById(tripId).orElse(null);
        if (trip == null) return false;

        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (user == null) return false;

        // 1. Trip Owner or System Admin
        if (trip.getOwner().getId().equals(user.getId()) ||
                (user.getRole() != null && "ADMINISTRATOR".equalsIgnoreCase(user.getRole().getName()))) {
            return true;
        }

        // 2. Group Admin role in TripMember
        Optional<TripMember> memberOpt = tripMemberRepository.findByTripIdAndUserEmail(tripId, userEmail);
        return memberOpt.isPresent() &&
                "APPROVED".equalsIgnoreCase(memberOpt.get().getStatus()) &&
                "GROUP_ADMIN".equalsIgnoreCase(memberOpt.get().getRole());
    }

    /**
     * Enforces access check or throws HTTP 403 Forbidden
     */
    public void verifyAccess(Integer tripId, String userEmail) {
        if (!isUserAllowedToAccessTrip(tripId, userEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have access permission for this trip.");
        }
    }

    /**
     * Enforces Group Admin / Owner management check or throws HTTP 403 Forbidden
     */
    public void verifyGroupAdminOrOwner(Integer tripId, String userEmail) {
        if (!isGroupAdminOrOwner(tripId, userEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Action restricted to Group Admin or Trip Owner.");
        }
    }
}
