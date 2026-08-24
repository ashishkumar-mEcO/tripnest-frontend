package com.tripnest.tripnest_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlaceResponse {
    private String name;
    private String formattedAddress;
    private Double rating;
    private Integer userRatingsTotal;
    private String category;
    private String photoUrl;
}
