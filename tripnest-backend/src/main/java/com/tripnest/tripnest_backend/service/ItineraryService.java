package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.dto.ItineraryRequest;
import com.tripnest.tripnest_backend.dto.ItineraryResponse;
import com.tripnest.tripnest_backend.entity.Itinerary;
import com.tripnest.tripnest_backend.entity.Trip;
import com.tripnest.tripnest_backend.repository.ItineraryRepository;
import com.tripnest.tripnest_backend.repository.TripRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ItineraryService {

    private final ItineraryRepository itineraryRepository;
    private final TripRepository tripRepository;
    private final TripAccessService tripAccessService;

    public ItineraryResponse createItinerary(Integer tripId, ItineraryRequest request, String userEmail) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Trip not found"));

        // Use reusable access check: Trip Owner, Admin, or Approved Member
        tripAccessService.verifyAccess(tripId, userEmail);

        Itinerary itinerary = new Itinerary();
        itinerary.setTrip(trip);
        itinerary.setDayNumber(request.getDayNumber());
        itinerary.setItineraryDate(request.getItineraryDate());
        itinerary.setTitle(request.getTitle());
        itinerary.setDescription(request.getDescription());

        Itinerary saved = itineraryRepository.save(itinerary);

        return mapToResponse(saved);
    }

    public List<ItineraryResponse> getItinerariesByTripId(Integer tripId, String userEmail) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Trip not found"));

        // Use reusable access check: Trip Owner, Admin, or Approved Member
        tripAccessService.verifyAccess(tripId, userEmail);

        return itineraryRepository.findByTripIdOrderByDayNumberAsc(tripId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private ItineraryResponse mapToResponse(Itinerary itinerary) {
        return new ItineraryResponse(
                itinerary.getId(),
                itinerary.getTrip().getId(),
                itinerary.getDayNumber(),
                itinerary.getItineraryDate(),
                itinerary.getTitle(),
                itinerary.getDescription(),
                itinerary.getCreatedAt(),
                itinerary.getUpdatedAt()
        );
    }
}
