package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.dto.TripRequest;
import com.tripnest.tripnest_backend.dto.TripResponse;
import com.tripnest.tripnest_backend.entity.Budget;
import com.tripnest.tripnest_backend.entity.Destination;
import com.tripnest.tripnest_backend.entity.Trip;
import com.tripnest.tripnest_backend.entity.User;
import com.tripnest.tripnest_backend.repository.ActivityRepository;
import com.tripnest.tripnest_backend.repository.BudgetRepository;
import com.tripnest.tripnest_backend.repository.DestinationRepository;
import com.tripnest.tripnest_backend.repository.ExpenseRepository;
import com.tripnest.tripnest_backend.repository.ItineraryRepository;
import com.tripnest.tripnest_backend.repository.TripMemberRepository;
import com.tripnest.tripnest_backend.repository.TripRepository;
import com.tripnest.tripnest_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TripService {

    private final TripRepository tripRepository;
    private final UserRepository userRepository;
    private final DestinationRepository destinationRepository;
    private final BudgetRepository budgetRepository;
    private final TripMemberRepository tripMemberRepository;
    private final ExpenseRepository expenseRepository;
    private final ItineraryRepository itineraryRepository;
    private final ActivityRepository activityRepository;
    private final TripAccessService tripAccessService;
    private final NotificationService notificationService;

    public TripResponse createTrip(TripRequest request, String userEmail) {
        User user = getUserByEmail(userEmail);

        Destination destination = null;
        if (request.getDestinationId() != null) {
            destination = destinationRepository.findById(request.getDestinationId())
                    .orElseThrow(() -> new RuntimeException("Destination not found with id: " + request.getDestinationId()));
        }

        Trip trip = new Trip();
        trip.setOwner(user);
        trip.setDestination(destination);
        trip.setTitle(request.getTitle());
        trip.setStartDate(request.getStartDate());
        trip.setEndDate(request.getEndDate());
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            trip.setStatus(request.getStatus().toUpperCase());
        } else {
            trip.setStatus("PLANNED");
        }

        Trip savedTrip = tripRepository.save(trip);

        // Always create a linked Budget record in budgets table
        BigDecimal initialBudget = request.getBudget() != null ? request.getBudget() : BigDecimal.ZERO;
        Budget budget = new Budget();
        budget.setTrip(savedTrip);
        budget.setTotalBudget(initialBudget);
        budget.setSpentAmount(BigDecimal.ZERO);
        budget.setCurrency("INR");
        budgetRepository.save(budget);

        return mapToResponse(savedTrip);
    }

    /**
     * Get My Trips: Includes trips owned by user + trips where user is an approved member
     */
    public List<TripResponse> getMyTrips(String userEmail) {
        User user = getUserByEmail(userEmail);

        Map<Integer, Trip> tripMap = new LinkedHashMap<>();

        // 1. Owned Trips
        tripRepository.findByOwnerId(user.getId()).forEach(t -> tripMap.put(t.getId(), t));

        // 2. Member Trips (Approved)
        tripMemberRepository.findByUserIdAndStatus(user.getId(), "APPROVED").forEach(tm -> {
            tripMap.putIfAbsent(tm.getTrip().getId(), tm.getTrip());
        });

        return tripMap.values().stream()
                .map(this::mapToResponse)
                .toList();
    }

    public TripResponse getTripById(Integer id, String userEmail) {
        tripAccessService.verifyAccess(id, userEmail);
        Trip trip = getTripEntityById(id);
        return mapToResponse(trip);
    }

    public TripResponse updateTrip(Integer id, TripRequest request, String userEmail) {
        tripAccessService.verifyGroupAdminOrOwner(id, userEmail);
        Trip trip = getTripEntityById(id);

        boolean coreDetailsChanged = false;
        if (!trip.getTitle().equals(request.getTitle())) coreDetailsChanged = true;
        if (request.getStartDate() != null && !request.getStartDate().equals(trip.getStartDate())) coreDetailsChanged = true;
        if (request.getEndDate() != null && !request.getEndDate().equals(trip.getEndDate())) coreDetailsChanged = true;
        if (request.getDestinationId() != null && (trip.getDestination() == null || !request.getDestinationId().equals(trip.getDestination().getId()))) coreDetailsChanged = true;

        if (request.getDestinationId() != null) {
            Destination destination = destinationRepository.findById(request.getDestinationId())
                    .orElseThrow(() -> new RuntimeException("Destination not found with id: " + request.getDestinationId()));
            trip.setDestination(destination);
        }

        trip.setTitle(request.getTitle());
        trip.setStartDate(request.getStartDate());
        trip.setEndDate(request.getEndDate());
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            trip.setStatus(request.getStatus().toUpperCase());
        }

        Trip updatedTrip = tripRepository.save(trip);

        if (request.getBudget() != null) {
            Budget budget = budgetRepository.findByTripId(id).orElse(null);
            if (budget == null) {
                budget = new Budget();
                budget.setTrip(updatedTrip);
                budget.setSpentAmount(BigDecimal.ZERO);
            }
            budget.setTotalBudget(request.getBudget());
            budget.setCurrency("INR");
            budgetRepository.save(budget);
        }

        if (coreDetailsChanged) {
            sendTravelUpdateNotifications(updatedTrip, userEmail);
        }

        return mapToResponse(updatedTrip);
    }

    private void sendTravelUpdateNotifications(Trip trip, String editorEmail) {
        List<User> recipients = new ArrayList<>();
        if (trip.getOwner() != null && !trip.getOwner().getEmail().equalsIgnoreCase(editorEmail)) {
            recipients.add(trip.getOwner());
        }
        tripMemberRepository.findByTripIdAndStatus(trip.getId(), "APPROVED").forEach(tm -> {
            if (tm.getUser() != null && !tm.getUser().getEmail().equalsIgnoreCase(editorEmail) && !recipients.contains(tm.getUser())) {
                recipients.add(tm.getUser());
            }
        });

        String msg = "Travel Update: Core trip details (dates, title, or destination) for '" + trip.getTitle() + "' have been updated.";
        for (User u : recipients) {
            notificationService.createNotification(u, msg, "TRAVEL_UPDATE");
        }
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteTrip(Integer id, String userEmail) {
        tripAccessService.verifyGroupAdminOrOwner(id, userEmail);
        Trip trip = getTripEntityById(id);

        // 1. Delete trip members
        tripMemberRepository.deleteByTripId(id);

        // 2. Delete budget and expenses if exists
        Budget budget = budgetRepository.findByTripId(id).orElse(null);
        if (budget != null) {
            expenseRepository.deleteByBudgetId(budget.getId());
            budgetRepository.delete(budget);
        }

        // 3. Delete activities and itineraries if exists
        List<com.tripnest.tripnest_backend.entity.Itinerary> itineraries = itineraryRepository.findByTripIdOrderByDayNumberAsc(id);
        for (com.tripnest.tripnest_backend.entity.Itinerary itin : itineraries) {
            activityRepository.deleteByItineraryId(itin.getId());
        }
        itineraryRepository.deleteByTripId(id);

        // 4. Delete trip entity
        tripRepository.delete(trip);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }

    private Trip getTripEntityById(Integer id) {
        return tripRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Trip not found with id: " + id));
    }

    private TripResponse mapToResponse(Trip t) {
        Integer destId = t.getDestination() != null ? t.getDestination().getId() : null;
        String destName = t.getDestination() != null ? t.getDestination().getName() : null;
        String destCountry = t.getDestination() != null ? t.getDestination().getCountry() : null;

        BigDecimal budgetAmount = budgetRepository.findByTripId(t.getId())
                .map(Budget::getTotalBudget)
                .orElse(BigDecimal.ZERO);

        return new TripResponse(
                t.getId(),
                t.getTitle(),
                t.getOwner().getId(),
                t.getOwner().getName(),
                destId,
                destName,
                destCountry,
                t.getStartDate(),
                t.getEndDate(),
                budgetAmount,
                t.getStatus()
        );
    }
}
