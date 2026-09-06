package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.dto.AttractionRequest;
import com.tripnest.tripnest_backend.dto.AttractionResponse;
import com.tripnest.tripnest_backend.entity.Attraction;
import com.tripnest.tripnest_backend.entity.Destination;
import com.tripnest.tripnest_backend.repository.AttractionRepository;
import com.tripnest.tripnest_backend.repository.DestinationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttractionService {

    private final AttractionRepository attractionRepository;
    private final DestinationRepository destinationRepository;

    public List<AttractionResponse> getAttractionsByDestination(Integer destinationId) {
        return attractionRepository.findByDestinationId(destinationId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
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
