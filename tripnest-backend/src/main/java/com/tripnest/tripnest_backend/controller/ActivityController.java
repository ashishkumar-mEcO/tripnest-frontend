package com.tripnest.tripnest_backend.controller;

import com.tripnest.tripnest_backend.dto.ActivityRequest;
import com.tripnest.tripnest_backend.dto.ActivityResponse;
import com.tripnest.tripnest_backend.service.ActivityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityService activityService;

    @PostMapping("/api/itineraries/{itineraryId}/activities")
    public ResponseEntity<ActivityResponse> createActivity(
            @PathVariable Integer itineraryId,
            @Valid @RequestBody ActivityRequest request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        ActivityResponse response = activityService.createActivity(itineraryId, request, userEmail);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/api/itineraries/{itineraryId}/activities")
    public ResponseEntity<List<ActivityResponse>> getActivitiesByItinerary(
            @PathVariable Integer itineraryId,
            Authentication authentication) {
        String userEmail = authentication.getName();
        List<ActivityResponse> response = activityService.getActivitiesByItineraryId(itineraryId, userEmail);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/api/itineraries/{itineraryId}/activities/{activityId}")
    public ResponseEntity<ActivityResponse> updateActivity(
            @PathVariable Integer itineraryId,
            @PathVariable Integer activityId,
            @Valid @RequestBody ActivityRequest request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        ActivityResponse response = activityService.updateActivity(activityId, request, userEmail);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/api/itineraries/{itineraryId}/activities/{activityId}")
    public ResponseEntity<Void> deleteActivity(
            @PathVariable Integer itineraryId,
            @PathVariable Integer activityId,
            Authentication authentication) {
        String userEmail = authentication.getName();
        activityService.deleteActivity(activityId, userEmail);
        return ResponseEntity.noContent().build();
    }
}
