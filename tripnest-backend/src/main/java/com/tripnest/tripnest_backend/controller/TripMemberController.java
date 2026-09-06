package com.tripnest.tripnest_backend.controller;

import com.tripnest.tripnest_backend.dto.AddMemberRequest;
import com.tripnest.tripnest_backend.dto.TripMemberDto;
import com.tripnest.tripnest_backend.dto.TripResponse;
import com.tripnest.tripnest_backend.service.TripMemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import com.tripnest.tripnest_backend.dto.UserSummaryResponse;
import com.tripnest.tripnest_backend.entity.User;
import com.tripnest.tripnest_backend.repository.UserRepository;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class TripMemberController {

    private final TripMemberService tripMemberService;
    private final UserRepository userRepository;

    /**
     * Search/Lookup a user by email before sending invitation
     * GET /api/users/lookup?email=...
     */
    @GetMapping("/users/lookup")
    public ResponseEntity<UserSummaryResponse> lookupUserByEmail(@RequestParam String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No registered traveler found with email: " + email));

        return ResponseEntity.ok(new UserSummaryResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole() != null ? user.getRole().getName() : "TRAVELER"
        ));
    }

    /**
     * 1. Add a member to a trip using their email address
     * POST /api/trips/{tripId}/members
     */
    @PostMapping("/trips/{tripId}/members")
    public ResponseEntity<TripMemberDto> addMemberByEmail(
            @PathVariable Integer tripId,
            @Valid @RequestBody AddMemberRequest request,
            Authentication auth) {
        TripMemberDto created = tripMemberService.addMemberByEmail(tripId, request, auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * 2. List all members of a trip
     * GET /api/trips/{tripId}/members
     */
    @GetMapping("/trips/{tripId}/members")
    public ResponseEntity<List<TripMemberDto>> listTripMembers(
            @PathVariable Integer tripId,
            Authentication auth) {
        List<TripMemberDto> members = tripMemberService.listTripMembers(tripId, auth.getName());
        return ResponseEntity.ok(members);
    }

    /**
     * 3. Remove a member from a trip
     * DELETE /api/trips/{tripId}/members/{memberId}
     */
    @DeleteMapping("/trips/{tripId}/members/{memberId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable Integer tripId,
            @PathVariable Integer memberId,
            Authentication auth) {
        tripMemberService.removeMember(tripId, memberId, auth.getName());
        return ResponseEntity.noContent().build();
    }

    /**
     * 4. Change a member's role (MEMBER or GROUP_ADMIN)
     * PUT /api/trips/{tripId}/members/{memberId}/role
     */
    @PutMapping("/trips/{tripId}/members/{memberId}/role")
    public ResponseEntity<TripMemberDto> changeMemberRole(
            @PathVariable Integer tripId,
            @PathVariable Integer memberId,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        String role = body.get("role");
        TripMemberDto updated = tripMemberService.changeMemberRole(tripId, memberId, role, auth.getName());
        return ResponseEntity.ok(updated);
    }

    /**
     * 5. Search trips by trip title for join request flow
     * GET /api/trips/search?title=Goa
     */
    @GetMapping("/trips/search")
    public ResponseEntity<List<TripResponse>> searchTrips(
            @RequestParam(required = false) String title) {
        List<TripResponse> results = tripMemberService.searchTripsByTitle(title);
        return ResponseEntity.ok(results);
    }

    /**
     * 6. Submit a request to join a trip
     * POST /api/trips/{tripId}/join-requests
     */
    @PostMapping("/trips/{tripId}/join-requests")
    public ResponseEntity<TripMemberDto> requestToJoinTrip(
            @PathVariable Integer tripId,
            Authentication auth) {
        TripMemberDto created = tripMemberService.requestToJoinTrip(tripId, auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * 7. List pending join requests for a trip
     * GET /api/trips/{tripId}/join-requests
     */
    @GetMapping("/trips/{tripId}/join-requests")
    public ResponseEntity<List<TripMemberDto>> listPendingJoinRequests(
            @PathVariable Integer tripId,
            Authentication auth) {
        List<TripMemberDto> requests = tripMemberService.listPendingJoinRequests(tripId, auth.getName());
        return ResponseEntity.ok(requests);
    }

    /**
     * 8. Process join request (Approve or Reject)
     * PUT /api/trips/{tripId}/join-requests/{requestId}
     * Body: { "approve": true }
     */
    @PutMapping("/trips/{tripId}/join-requests/{requestId}")
    public ResponseEntity<TripMemberDto> processJoinRequest(
            @PathVariable Integer tripId,
            @PathVariable Integer requestId,
            @RequestBody Map<String, Boolean> body,
            Authentication auth) {
        boolean approve = body.getOrDefault("approve", true);
        TripMemberDto updated = tripMemberService.processJoinRequest(tripId, requestId, approve, auth.getName());
        return ResponseEntity.ok(updated);
    }
}
