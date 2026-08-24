package com.tripnest.tripnest_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class TripRequest {

    @NotBlank(message = "Trip title is required")
    private String title;

    private Integer destinationId;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    private BigDecimal budget;

    private String status = "PLANNED";
}
