package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.dto.AddMemberRequest;
import com.tripnest.tripnest_backend.dto.TripMemberDto;
import com.tripnest.tripnest_backend.dto.TripResponse;
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

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TripMemberService {

    private final TripRepository tripRepository;
    private final UserRepository userRepository;
    private final TripMemberRepository tripMemberRepository;
    private final TripAccessService tripAccessService;
    private final NotificationService notificationService;

    /**
     * 1. Add member to trip by email address (Restricted to Owner/Group Admin)
     */
    public TripMemberDto addMemberByEmail(Integer tripId, AddMemberRequest request, String currentUserEmail) {
        tripAccessService.verifyGroupAdminOrOwner(tripId, currentUserEmail);

        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Trip not found with id: " + tripId));

        User targetUser = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with email: " + request.getEmail()));

        // Check if user is trip owner
        if (trip.getOwner().getId().equals(targetUser.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trip owner is already automatically a member");
        }

        // Check if member record already exists
        Optional<TripMember> existingOpt = tripMemberRepository.findByTripIdAndUserId(tripId, targetUser.getId());

        TripMember member;
        if (existingOpt.isPresent()) {
            member = existingOpt.get();
            if ("APPROVED".equalsIgnoreCase(member.getStatus())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User is already an approved member of this trip");
            }
            member.setStatus("APPROVED");
            if (request.getRole() != null && !request.getRole().isBlank()) {
                member.setRole(request.getRole().toUpperCase());
            }
        } else {
            member = new TripMember();
            member.setTrip(trip);
            member.setUser(targetUser);
            member.setRole(request.getRole() != null ? request.getRole().toUpperCase() : "MEMBER");
            member.setStatus("APPROVED");
        }

        TripMember saved = tripMemberRepository.save(member);

        // Trigger Notification for newly added member
        notificationService.createNotification(
                targetUser,
                "You have been added as a member to the trip '" + trip.getTitle() + "'!",
                "MEMBER_ADDED"
        );

        return mapToDto(saved);
    }

    /**
     * 2. List all approved members of a trip (Includes Trip Owner automatically as GROUP_ADMIN)
     */
    public List<TripMemberDto> listTripMembers(Integer tripId, String currentUserEmail) {
        tripAccessService.verifyAccess(tripId, currentUserEmail);

        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Trip not found with id: " + tripId));

        List<TripMemberDto> resultList = new ArrayList<>();

        // 1. Always include Trip Owner as GROUP_ADMIN at top of list
        User owner = trip.getOwner();
        resultList.add(new TripMemberDto(
                0,
                trip.getId(),
                owner.getId(),
                owner.getName(),
                owner.getEmail(),
                "GROUP_ADMIN",
                "APPROVED",
                null
        ));

        // 2. Include all approved trip members from trip_members table
        tripMemberRepository.findByTripIdAndStatus(tripId, "APPROVED").stream()
                .filter(m -> !m.getUser().getId().equals(owner.getId()))
                .map(this::mapToDto)
                .forEach(resultList::add);

        return resultList;
    }

    /**
     * 3. Remove a member from a trip (Restricted to Owner/Group Admin)
     */
    public void removeMember(Integer tripId, Integer memberId, String currentUserEmail) {
        TripMember member = tripMemberRepository.findById(memberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Trip member record not found"));

        if (!member.getTrip().getId().equals(tripId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Member does not belong to trip ID: " + tripId);
        }

        // Allow if user is removing themselves (Leave Trip) OR if user is Group Admin/Owner
        boolean isSelf = member.getUser().getEmail().equalsIgnoreCase(currentUserEmail);
        if (!isSelf) {
            tripAccessService.verifyGroupAdminOrOwner(tripId, currentUserEmail);
        }

        // Prevent removing the Trip Owner
        if (member.getTrip().getOwner().getId().equals(member.getUser().getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot remove the Trip Owner from the trip");
        }

        tripMemberRepository.delete(member);
    }

    /**
     * 4. Change a member's role (Restricted to Owner/Group Admin)
     */
    public TripMemberDto changeMemberRole(Integer tripId, Integer memberId, String newRole, String currentUserEmail) {
        tripAccessService.verifyGroupAdminOrOwner(tripId, currentUserEmail);

        TripMember member = tripMemberRepository.findById(memberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Trip member record not found"));

        if (!member.getTrip().getId().equals(tripId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Member does not belong to trip ID: " + tripId);
        }

        if (newRole == null || (!newRole.equalsIgnoreCase("MEMBER") && !newRole.equalsIgnoreCase("GROUP_ADMIN"))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role must be MEMBER or GROUP_ADMIN");
        }

        member.setRole(newRole.toUpperCase());
        TripMember updated = tripMemberRepository.save(member);
        return mapToDto(updated);
    }

    /**
     * 5. Search public trips by title for join request flow
     */
    public List<TripResponse> searchTripsByTitle(String titleQuery) {
        if (titleQuery == null || titleQuery.trim().isBlank()) {
            return List.of();
        }

        return tripRepository.findAll().stream()
                .filter(t -> t.getTitle().toLowerCase().contains(titleQuery.toLowerCase()) ||
                        (t.getDestination() != null && t.getDestination().getName().toLowerCase().contains(titleQuery.toLowerCase())))
                .map(t -> new TripResponse(
                        t.getId(),
                        t.getTitle(),
                        t.getOwner().getId(),
                        t.getOwner().getName(),
                        t.getDestination() != null ? t.getDestination().getId() : null,
                        t.getDestination() != null ? t.getDestination().getName() : null,
                        t.getDestination() != null ? t.getDestination().getCountry() : null,
                        t.getStartDate(),
                        t.getEndDate(),
                        null,
                        t.getStatus()
                ))
                .toList();
    }

    /**
     * 6. Submit a request to join a trip by trip ID
     */
    public TripMemberDto requestToJoinTrip(Integer tripId, String userEmail) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Trip not found with id: " + tripId));

        User requestingUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (trip.getOwner().getId().equals(requestingUser.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You are the owner of this trip");
        }

        Optional<TripMember> existingOpt = tripMemberRepository.findByTripIdAndUserId(tripId, requestingUser.getId());
        TripMember saved;
        if (existingOpt.isPresent()) {
            TripMember existing = existingOpt.get();
            if ("APPROVED".equalsIgnoreCase(existing.getStatus())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You are already a member of this trip");
            }
            if ("PENDING".equalsIgnoreCase(existing.getStatus())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Your join request is already pending approval");
            }
            existing.setStatus("PENDING");
            saved = tripMemberRepository.save(existing);
        } else {
            TripMember newRequest = new TripMember();
            newRequest.setTrip(trip);
            newRequest.setUser(requestingUser);
            newRequest.setRole("MEMBER");
            newRequest.setStatus("PENDING");
            saved = tripMemberRepository.save(newRequest);
        }

        // 1. Trigger notification for Trip Owner / Admin (Recipient of request)
        notificationService.createNotification(
                trip.getOwner(),
                requestingUser.getName() + " requested to join your trip '" + trip.getTitle() + "'.",
                "JOIN_REQUEST_SUBMITTED"
        );

        // 2. Trigger instant confirmation notification for Applicant
        notificationService.createNotification(
                requestingUser,
                "Your request to join the trip '" + trip.getTitle() + "' has been submitted and is pending approval.",
                "JOIN_REQUEST_SUBMITTED"
        );

        return mapToDto(saved);
    }

    /**
     * 7. List pending join requests (Restricted to Owner/Group Admin)
     */
    public List<TripMemberDto> listPendingJoinRequests(Integer tripId, String currentUserEmail) {
        tripAccessService.verifyGroupAdminOrOwner(tripId, currentUserEmail);
        return tripMemberRepository.findByTripIdAndStatus(tripId, "PENDING").stream()
                .map(this::mapToDto)
                .toList();
    }

    /**
     * 8. Process Join Request (Approve or Reject) (Restricted to Owner/Group Admin)
     */
    public TripMemberDto processJoinRequest(Integer tripId, Integer requestId, boolean approve, String currentUserEmail) {
        tripAccessService.verifyGroupAdminOrOwner(tripId, currentUserEmail);

        TripMember request = tripMemberRepository.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Join request record not found"));

        if (!request.getTrip().getId().equals(tripId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request does not belong to trip ID: " + tripId);
        }

        if (approve) {
            request.setStatus("APPROVED");
        } else {
            request.setStatus("REJECTED");
        }

        TripMember updated = tripMemberRepository.save(request);

        // Trigger notification for original requester informing them of outcome
        String statusMsg = approve
                ? "Your request to join the trip '" + request.getTrip().getTitle() + "' was approved! 🎉"
                : "Your request to join the trip '" + request.getTrip().getTitle() + "' was declined.";
        String type = approve ? "JOIN_REQUEST_APPROVED" : "JOIN_REQUEST_REJECTED";

        notificationService.createNotification(request.getUser(), statusMsg, type);

        return mapToDto(updated);
    }

    private TripMemberDto mapToDto(TripMember m) {
        return new TripMemberDto(
                m.getId(),
                m.getTrip().getId(),
                m.getUser().getId(),
                m.getUser().getName(),
                m.getUser().getEmail(),
                m.getRole(),
                m.getStatus(),
                m.getCreatedAt()
        );
    }
}
