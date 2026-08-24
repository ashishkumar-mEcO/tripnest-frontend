package com.tripnest.tripnest_backend.controller;

import com.tripnest.tripnest_backend.dto.WeatherResponse;
import com.tripnest.tripnest_backend.service.WeatherService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/weather")
@RequiredArgsConstructor
public class WeatherController {

    private final WeatherService weatherService;

    @GetMapping
    public ResponseEntity<WeatherResponse> getWeatherByCity(@RequestParam String city) {
        WeatherResponse response = weatherService.getWeatherByCity(city);
        return ResponseEntity.ok(response);
    }
}
