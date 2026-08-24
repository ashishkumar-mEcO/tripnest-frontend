package com.tripnest.tripnest_backend.controller;

import com.tripnest.tripnest_backend.dto.ItineraryRequest;
import com.tripnest.tripnest_backend.dto.ItineraryResponse;
import com.tripnest.tripnest_backend.service.ItineraryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trips/{tripId}/itineraries")
@RequiredArgsConstructor
public class ItineraryController {

    private final ItineraryService itineraryService;

    @PostMapping
    public ResponseEntity<ItineraryResponse> createItinerary(
            @PathVariable Integer tripId,
            @Valid @RequestBody ItineraryRequest request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        ItineraryResponse response = itineraryService.createItinerary(tripId, request, userEmail);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<ItineraryResponse>> getItineraries(
            @PathVariable Integer tripId,
            Authentication authentication) {
        String userEmail = authentication.getName();
        List<ItineraryResponse> response = itineraryService.getItinerariesByTripId(tripId, userEmail);
        return ResponseEntity.ok(response);
    }
}
