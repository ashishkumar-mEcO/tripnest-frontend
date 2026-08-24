package com.tripnest.tripnest_backend.controller;

import com.tripnest.tripnest_backend.dto.DestinationResponse;
import com.tripnest.tripnest_backend.dto.PlaceResponse;
import com.tripnest.tripnest_backend.dto.WeatherResponse;
import com.tripnest.tripnest_backend.service.DestinationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/destinations")
@RequiredArgsConstructor
public class DestinationController {

    private final DestinationService destinationService;

    @GetMapping
    public ResponseEntity<List<DestinationResponse>> getAllDestinations() {
        return ResponseEntity.ok(destinationService.getAllDestinations());
    }

    @GetMapping("/popular")
    public ResponseEntity<List<DestinationResponse>> getPopularDestinations() {
        return ResponseEntity.ok(destinationService.getPopularDestinations());
    }

    @GetMapping("/places")
    public ResponseEntity<PlaceResponse> getGooglePlacesDetails(@RequestParam String query) {
        return ResponseEntity.ok(destinationService.getGooglePlacesDetails(query));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DestinationResponse> getDestinationById(@PathVariable Integer id) {
        return ResponseEntity.ok(destinationService.getDestinationById(id));
    }

    @GetMapping("/{id}/weather")
    public ResponseEntity<WeatherResponse> getDestinationWeather(@PathVariable Integer id) {
        return ResponseEntity.ok(destinationService.getWeatherForDestination(id));
    }
}
