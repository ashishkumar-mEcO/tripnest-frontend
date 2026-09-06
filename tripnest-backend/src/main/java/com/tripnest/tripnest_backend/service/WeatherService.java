package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.dto.WeatherResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class WeatherService {

    private final RestTemplate restTemplate = new RestTemplate();

    public WeatherResponse getWeatherByCity(String cityName) {
        if (cityName == null || cityName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "City or country name is required");
        }

        String searchName = cityName.trim();

        // 1. Live Geocoding API to resolve coordinates for any city/country on Earth
        String geoUrl = String.format("https://geocoding-api.open-meteo.com/v1/search?name=%s&count=1", searchName);

        try {
            Map<String, Object> geoResponse = restTemplate.getForObject(geoUrl, Map.class);
            if (geoResponse == null || !geoResponse.containsKey("results")) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "City or country not found: " + cityName);
            }

            List<Map<String, Object>> results = (List<Map<String, Object>>) geoResponse.get("results");
            if (results == null || results.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "City or country not found: " + cityName);
            }

            Map<String, Object> firstLocation = results.get(0);
            Double lat = ((Number) firstLocation.get("latitude")).doubleValue();
            Double lon = ((Number) firstLocation.get("longitude")).doubleValue();
            String foundName = (String) firstLocation.getOrDefault("name", searchName);
            String country = (String) firstLocation.getOrDefault("country", "");

            String displayName = country.isEmpty() ? foundName : foundName + ", " + country;

            // 2. Fetch Live Weather Data from Weather Satellite API
            String weatherUrl = String.format("https://api.open-meteo.com/v1/forecast?latitude=%f&longitude=%f&current_weather=true", lat, lon);
            Map<String, Object> weatherResponse = restTemplate.getForObject(weatherUrl, Map.class);

            if (weatherResponse == null || !weatherResponse.containsKey("current_weather")) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Live weather data not available for: " + cityName);
            }

            Map<String, Object> currentWeather = (Map<String, Object>) weatherResponse.get("current_weather");
            Double temp = ((Number) currentWeather.get("temperature")).doubleValue();
            Double windSpeed = ((Number) currentWeather.get("windspeed")).doubleValue();
            Integer weatherCode = ((Number) currentWeather.get("weathercode")).intValue();

            String description = decodeWeatherCode(weatherCode);
            String icon = weatherCode == 0 ? "01d" : weatherCode <= 3 ? "02d" : "10d";

            return new WeatherResponse(displayName, temp, description, 60, windSpeed, icon);
        } catch (ResponseStatusException rse) {
            throw rse;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Live weather API request failed: " + e.getMessage());
        }
    }

    private String decodeWeatherCode(int code) {
        return switch (code) {
            case 0 -> "Clear Sky & Sunny";
            case 1, 2, 3 -> "Partly Cloudy";
            case 45, 48 -> "Foggy";
            case 51, 53, 55 -> "Light Drizzle";
            case 61, 63, 65 -> "Rainy";
            case 71, 73, 75 -> "Snowy";
            case 80, 81, 82 -> "Rain Showers";
            case 95, 96, 99 -> "Thunderstorm";
            default -> "Clear / Mild";
        };
    }
}
