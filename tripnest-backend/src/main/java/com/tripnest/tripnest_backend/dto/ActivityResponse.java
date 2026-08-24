package com.tripnest.tripnest_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ActivityResponse {

    private Integer id;
    private Integer itineraryId;
    private String activityName;
    private String activityType;
    private LocalTime startTime;
    private LocalTime endTime;
    private String location;
    private String description;
    private Boolean reminder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
