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
        try {
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) TripNest/1.0");
            org.springframework.http.HttpEntity<Void> requestEntity = new org.springframework.http.HttpEntity<>(headers);

            String geoUrl = String.format("https://geocoding-api.open-meteo.com/v1/search?name=%s&count=1", searchName);
            var geoExchange = restTemplate.exchange(geoUrl, org.springframework.http.HttpMethod.GET, requestEntity, Map.class);
            Map<String, Object> geoResponse = geoExchange.getBody();

            if (geoResponse != null && geoResponse.containsKey("results")) {
                List<Map<String, Object>> results = (List<Map<String, Object>>) geoResponse.get("results");
                if (results != null && !results.isEmpty()) {
                    Map<String, Object> firstLocation = results.get(0);
                    Double lat = ((Number) firstLocation.get("latitude")).doubleValue();
                    Double lon = ((Number) firstLocation.get("longitude")).doubleValue();
                    String foundName = (String) firstLocation.getOrDefault("name", searchName);
                    String country = (String) firstLocation.getOrDefault("country", "");
                    String displayName = country.isEmpty() ? foundName : foundName + ", " + country;

                    // 2. Fetch Live Weather Data from Weather Satellite API with custom User-Agent
                    String weatherUrl = String.format("https://api.open-meteo.com/v1/forecast?latitude=%f&longitude=%f&current_weather=true", lat, lon);
                    var weatherExchange = restTemplate.exchange(weatherUrl, org.springframework.http.HttpMethod.GET, requestEntity, Map.class);
                    Map<String, Object> weatherResponse = weatherExchange.getBody();

                    if (weatherResponse != null && weatherResponse.containsKey("current_weather")) {
                        Map<String, Object> currentWeather = (Map<String, Object>) weatherResponse.get("current_weather");
                        Double temp = ((Number) currentWeather.get("temperature")).doubleValue();
                        Double windSpeed = ((Number) currentWeather.get("windspeed")).doubleValue();
                        Integer weatherCode = ((Number) currentWeather.get("weathercode")).intValue();

                        String description = decodeWeatherCode(weatherCode);
                        String icon = weatherCode == 0 ? "01d" : weatherCode <= 3 ? "02d" : "10d";

                        return new WeatherResponse(displayName, temp, description, 60, windSpeed, icon);
                    }
                }
            }
        } catch (Exception ignored) {
            // Open-Meteo secondary fallback to wttr.in live weather API
        }

        // 3. Secondary Live Weather Provider: wttr.in real-time API
        return fetchLiveWttrWeather(searchName);
    }

    private WeatherResponse fetchLiveWttrWeather(String cityName) {
        try {
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) TripNest/1.0");
            org.springframework.http.HttpEntity<Void> requestEntity = new org.springframework.http.HttpEntity<>(headers);

            String wttrUrl = String.format("https://wttr.in/%s?format=j1", cityName);
            var exchange = restTemplate.exchange(wttrUrl, org.springframework.http.HttpMethod.GET, requestEntity, Map.class);
            Map<String, Object> body = exchange.getBody();

            if (body != null && body.containsKey("current_condition")) {
                List<Map<String, Object>> currentConditionList = (List<Map<String, Object>>) body.get("current_condition");
                if (!currentConditionList.isEmpty()) {
                    Map<String, Object> cond = currentConditionList.get(0);
                    Double tempC = Double.parseDouble((String) cond.get("temp_C"));
                    Double windKph = Double.parseDouble((String) cond.get("windspeedKmph"));
                    Integer humidity = Integer.parseInt((String) cond.get("humidity"));

                    String weatherDesc = "Clear & Mild";
                    if (cond.containsKey("weatherDesc")) {
                        List<Map<String, Object>> descList = (List<Map<String, Object>>) cond.get("weatherDesc");
                        if (!descList.isEmpty()) {
                            weatherDesc = (String) descList.get(0).get("value");
                        }
                    }

                    return new WeatherResponse(cityName, tempC, weatherDesc, humidity, windKph, "01d");
                }
            }
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Live weather unavailable for: " + cityName);
        }
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Live weather unavailable for: " + cityName);
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
