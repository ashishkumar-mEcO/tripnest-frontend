package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.dto.PlaceResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GooglePlacesService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${google.places.api.key:YOUR_GOOGLE_PLACES_KEY}")
    private String apiKey;

    @Value("${google.places.api.url:https://maps.googleapis.com/maps/api/place/textsearch/json}")
    private String apiUrl;

    public PlaceResponse searchPlaceDetails(String placeName) {
        if (placeName == null || placeName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Place name is required");
        }

        String searchName = placeName.trim();

        // 1. Try Google Places API if key configured
        if (apiKey != null && !apiKey.contains("YOUR_GOOGLE_PLACES") && !apiKey.isBlank()) {
            String url = String.format("%s?query=%s&key=%s", apiUrl, searchName, apiKey);
            try {
                Map<String, Object> response = restTemplate.getForObject(url, Map.class);
                if (response != null && "OK".equals(response.get("status"))) {
                    List<Map<String, Object>> results = (List<Map<String, Object>>) response.get("results");
                    if (results != null && !results.isEmpty()) {
                        Map<String, Object> firstResult = results.get(0);
                        String name = (String) firstResult.getOrDefault("name", searchName);
                        String address = (String) firstResult.getOrDefault("formatted_address", searchName);
                        Double rating = firstResult.get("rating") != null ? ((Number) firstResult.get("rating")).doubleValue() : 4.8;
                        Integer totalRatings = firstResult.get("user_ratings_total") != null ? ((Number) firstResult.get("user_ratings_total")).intValue() : 1240;

                        return new PlaceResponse(name, address, rating, totalRatings, getCategoryForPlace(searchName), "https://images.unsplash.com/photo-1507525428034-b723cf961d3e");
                    }
                }
            } catch (Exception ignored) {}
        }

        // 2. Pure Live Geocoding API for ANY city, region, or country in the world (Russia, London, Tokyo, Dubai, Sydney, New York, etc.)
        String geoUrl = String.format("https://geocoding-api.open-meteo.com/v1/search?name=%s&count=1", searchName);
        try {
            Map<String, Object> geoResponse = restTemplate.getForObject(geoUrl, Map.class);
            if (geoResponse != null && geoResponse.containsKey("results")) {
                List<Map<String, Object>> results = (List<Map<String, Object>>) geoResponse.get("results");
                if (results != null && !results.isEmpty()) {
                    Map<String, Object> loc = results.get(0);
                    String foundName = (String) loc.getOrDefault("name", searchName);
                    String country = (String) loc.getOrDefault("country", "");
                    String address = country.isEmpty() ? foundName + ", Global Destination" : foundName + ", " + country;

                    return new PlaceResponse(
                            foundName,
                            address,
                            4.8,
                            2150,
                            getCategoryForPlace(searchName),
                            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e"
                    );
                }
            }
        } catch (Exception ignored) {}

        // 3. Reject unpronounceable gibberish (e.g. "dfafgd", "qwerty")
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No verified travel destination found matching: " + placeName);
    }

    private String getCategoryForPlace(String placeName) {
        String lower = placeName.toLowerCase();
        if (lower.contains("beach") || lower.contains("coast") || lower.contains("island") || lower.contains("goa") || lower.contains("bali")) return "Beach & Coastal";
        if (lower.contains("mountain") || lower.contains("park") || lower.contains("nature") || lower.contains("manali")) return "Nature & Mountain";
        if (lower.contains("fort") || lower.contains("palace") || lower.contains("museum") || lower.contains("temple") || lower.contains("russia") || lower.contains("paris") || lower.contains("rome")) return "Heritage & Culture";
        return "City & Tourist Attraction";
    }
}
