package com.tripnest.tripnest_backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalTime;

@Data
public class ActivityRequest {

    @NotBlank(message = "Activity name is required")
    private String activityName;

    private String activityType;

    private LocalTime startTime;

    private LocalTime endTime;

    private String location;

    private String description;

    private Boolean reminder;
}
