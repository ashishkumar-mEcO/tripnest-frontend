package com.tripnest.tripnest_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttractionResponse {
    private Integer id;
    private Integer destinationId;
    private String destinationName;
    private String name;
    private String description;
    private LocalDateTime createdAt;
}
