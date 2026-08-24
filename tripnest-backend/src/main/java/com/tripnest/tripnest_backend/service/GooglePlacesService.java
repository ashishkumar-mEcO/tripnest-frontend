package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.dto.PlaceResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

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
        if (apiKey == null || apiKey.contains("YOUR_GOOGLE_PLACES") || apiKey.isEmpty()) {
            return getFallbackPlaceDetails(placeName);
        }

        String url = String.format("%s?query=%s&key=%s", apiUrl, placeName, apiKey);

        try {
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response == null || !"OK".equals(response.get("status"))) {
                return getFallbackPlaceDetails(placeName);
            }

            List<Map<String, Object>> results = (List<Map<String, Object>>) response.get("results");
            if (results == null || results.isEmpty()) {
                return getFallbackPlaceDetails(placeName);
            }

            Map<String, Object> firstResult = results.get(0);
            String name = (String) firstResult.getOrDefault("name", placeName);
            String address = (String) firstResult.getOrDefault("formatted_address", placeName);
            Double rating = firstResult.get("rating") != null ? ((Number) firstResult.get("rating")).doubleValue() : 4.8;
            Integer totalRatings = firstResult.get("user_ratings_total") != null ? ((Number) firstResult.get("user_ratings_total")).intValue() : 1240;

            return new PlaceResponse(name, address, rating, totalRatings, getCategoryForPlace(placeName), "https://images.unsplash.com/photo-1507525428034-b723cf961d3e");
        } catch (Exception e) {
            return getFallbackPlaceDetails(placeName);
        }
    }

    private PlaceResponse getFallbackPlaceDetails(String placeName) {
        String category = getCategoryForPlace(placeName);
        return new PlaceResponse(
                placeName,
                placeName + ", Global Tourist Destination",
                4.8,
                1420,
                category,
                "https://images.unsplash.com/photo-1507525428034-b723cf961d3e"
        );
    }

    private String getCategoryForPlace(String placeName) {
        String lower = placeName.toLowerCase();
        if (lower.contains("goa") || lower.contains("bali") || lower.contains("beach")) return "Beach & Coastal";
        if (lower.contains("kerala") || lower.contains("manali") || lower.contains("nature")) return "Nature & Mountain";
        if (lower.contains("paris") || lower.contains("jaipur") || lower.contains("rome")) return "Heritage & Culture";
        return "City & Modern";
    }
}
