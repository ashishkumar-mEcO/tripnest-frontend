package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.dto.AttractionRequest;
import com.tripnest.tripnest_backend.dto.AttractionResponse;
import com.tripnest.tripnest_backend.entity.Attraction;
import com.tripnest.tripnest_backend.entity.Destination;
import com.tripnest.tripnest_backend.repository.AttractionRepository;
import com.tripnest.tripnest_backend.repository.DestinationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttractionService {

    private final AttractionRepository attractionRepository;
    private final DestinationRepository destinationRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    public List<AttractionResponse> getAttractionsByDestination(Integer destinationId) {
        List<Attraction> list = attractionRepository.findByDestinationId(destinationId);
        
        if (list.isEmpty()) {
            Destination destination = destinationRepository.findById(destinationId).orElse(null);
            if (destination != null) {
                fetchAndSaveLiveAttractions(destination);
                list = attractionRepository.findByDestinationId(destinationId);
            }
        }

        return list.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private void fetchAndSaveLiveAttractions(Destination destination) {
        try {
            String query = destination.getName() + " " + destination.getCountry() + " tourist attractions landmarks";
            String encoded = URLEncoder.encode(query, StandardCharsets.UTF_8);
            String wikiUrl = String.format("https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=%s&format=json&utf8=1", encoded);

            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "TripNestApp/1.0 contact@tripnest.com");
            HttpEntity<Void> requestEntity = new HttpEntity<>(headers);

            var exchange = restTemplate.exchange(wikiUrl, HttpMethod.GET, requestEntity, Map.class);
            Map<String, Object> body = exchange.getBody();

            if (body != null && body.containsKey("query")) {
                Map<String, Object> queryMap = (Map<String, Object>) body.get("query");
                if (queryMap.containsKey("search")) {
                    List<Map<String, Object>> searchResults = (List<Map<String, Object>>) queryMap.get("search");
                    int count = 0;
                    for (Map<String, Object> item : searchResults) {
                        String title = (String) item.get("title");
                        String snippet = (String) item.get("snippet");

                        if (title == null) continue;
                        String lowerTitle = title.toLowerCase();
                        if (lowerTitle.startsWith("list of") || lowerTitle.contains("category:") || lowerTitle.contains("wikipedia:")) {
                            continue;
                        }

                        if (snippet != null) {
                            snippet = snippet.replaceAll("<[^>]*>", "").replaceAll("&quot;", "\"").replaceAll("&#039;", "'").trim();
                        } else {
                            snippet = "Famous landmark in " + destination.getName() + ", " + destination.getCountry();
                        }

                        Attraction attraction = new Attraction();
                        attraction.setDestination(destination);
                        attraction.setName(title);
                        attraction.setDescription(snippet);
                        attractionRepository.save(attraction);

                        count++;
                        if (count >= 5) break;
                    }
                }
            }
        } catch (Exception ignored) {
            // If live API fails, save fallback top attraction for the destination
            Attraction defaultAttraction = new Attraction();
            defaultAttraction.setDestination(destination);
            defaultAttraction.setName(destination.getName() + " Historic Center & Landmarks");
            defaultAttraction.setDescription("Iconic attractions and vibrant cultural points of interest in " + destination.getName() + ", " + destination.getCountry());
            attractionRepository.save(defaultAttraction);
        }
    }

    public AttractionResponse createAttraction(Integer destinationId, AttractionRequest request) {
        Destination destination = destinationRepository.findById(destinationId)
                .orElseThrow(() -> new RuntimeException("Destination not found with id: " + destinationId));

        Attraction attraction = new Attraction();
        attraction.setDestination(destination);
        attraction.setName(request.getName());
        attraction.setDescription(request.getDescription());

        Attraction saved = attractionRepository.save(attraction);
        return mapToResponse(saved);
    }

    private AttractionResponse mapToResponse(Attraction attraction) {
        return new AttractionResponse(
                attraction.getId(),
                attraction.getDestination().getId(),
                attraction.getDestination().getName(),
                attraction.getName(),
                attraction.getDescription(),
                attraction.getCreatedAt()
        );
    }
}
