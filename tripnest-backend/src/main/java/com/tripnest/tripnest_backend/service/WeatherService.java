package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.dto.WeatherResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Locale;
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
        String encodedCity = URLEncoder.encode(searchName, StandardCharsets.UTF_8);

        // 1. Live Geocoding API to resolve coordinates for any city/country on Earth
        try {
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) TripNest/1.0");
            org.springframework.http.HttpEntity<Void> requestEntity = new org.springframework.http.HttpEntity<>(headers);

            String geoUrl = String.format(Locale.US, "https://geocoding-api.open-meteo.com/v1/search?name=%s&count=1", encodedCity);
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

                    // 2. Primary Weather API: met.no live satellite forecast
                    try {
                        String metUrl = String.format(Locale.US, "https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=%.4f&lon=%.4f", lat, lon);
                        org.springframework.http.HttpHeaders metHeaders = new org.springframework.http.HttpHeaders();
                        metHeaders.set("User-Agent", "TripNestApp/1.0 contact@tripnest.com");
                        org.springframework.http.HttpEntity<Void> metRequest = new org.springframework.http.HttpEntity<>(metHeaders);

                        var metExchange = restTemplate.exchange(metUrl, org.springframework.http.HttpMethod.GET, metRequest, Map.class);
                        Map<String, Object> metBody = metExchange.getBody();

                        if (metBody != null && metBody.containsKey("properties")) {
                            Map<String, Object> props = (Map<String, Object>) metBody.get("properties");
                            List<Map<String, Object>> timeseries = (List<Map<String, Object>>) props.get("timeseries");
                            if (timeseries != null && !timeseries.isEmpty()) {
                                Map<String, Object> latestData = (Map<String, Object>) timeseries.get(0).get("data");
                                Map<String, Object> instantDetails = (Map<String, Object>) ((Map<String, Object>) latestData.get("instant")).get("details");

                                Double temp = ((Number) instantDetails.get("air_temperature")).doubleValue();
                                Double humidity = ((Number) instantDetails.get("relative_humidity")).doubleValue();
                                Double windSpeed = ((Number) instantDetails.get("wind_speed")).doubleValue();

                                String desc = "Clear & Mild";
                                if (latestData.containsKey("next_1_hours")) {
                                    Map<String, Object> n1h = (Map<String, Object>) latestData.get("next_1_hours");
                                    if (n1h != null && n1h.containsKey("summary")) {
                                        desc = (String) ((Map<String, Object>) n1h.get("summary")).get("symbol_code");
                                        desc = desc.replace("_", " ").toUpperCase();
                                    }
                                }

                                return new WeatherResponse(displayName, temp, desc, humidity.intValue(), windSpeed, "01d");
                            }
                        }
                    } catch (Exception metEx) {
                        // Fallback to Open-Meteo
                    }

                    // 3. Secondary Weather API: Open-Meteo forecast
                    try {
                        String weatherUrl = String.format(Locale.US, "https://api.open-meteo.com/v1/forecast?latitude=%.6f&longitude=%.6f&current_weather=true", lat, lon);
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
                    } catch (Exception openMeteoEx) {
                        // Fallback to wttr.in
                    }
                }
            }
        } catch (Exception ignored) {
            // Geocoding fallback
        }

        // 4. Tertiary Weather API: wttr.in real-time API
        return fetchLiveWttrWeather(searchName, encodedCity);
    }

    private WeatherResponse fetchLiveWttrWeather(String cityName, String encodedCity) {
        try {
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) TripNest/1.0");
            org.springframework.http.HttpEntity<Void> requestEntity = new org.springframework.http.HttpEntity<>(headers);

            String wttrUrl = String.format("https://wttr.in/%s?format=j1", encodedCity);
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
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Live weather service temporarily unavailable for " + cityName);
        }
        throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Live weather service temporarily unavailable for " + cityName);
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
