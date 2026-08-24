package com.tripnest.tripnest_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WeatherResponse {
    private String cityName;
    private Double temperatureCelsius;
    private String description;
    private Integer humidity;
    private Double windSpeed;
    private String icon;
}
