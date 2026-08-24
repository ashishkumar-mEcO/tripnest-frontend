package com.tripnest.tripnest_backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ItineraryRequest {

    @NotNull(message = "Day number is required")
    private Integer dayNumber;

    private LocalDate itineraryDate;

    private String title;

    private String description;
}
