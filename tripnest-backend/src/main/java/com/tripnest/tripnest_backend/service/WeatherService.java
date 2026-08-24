package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.dto.WeatherResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class WeatherService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${weather.api.key}")
    private String apiKey;

    @Value("${weather.api.url}")
    private String apiUrl;

    public WeatherResponse getWeatherByCity(String cityName) {
        String url = String.format("%s?q=%s&appid=%s&units=metric", apiUrl, cityName, apiKey);
        
        try {
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response == null) return getFallbackWeather(cityName);

            Map<String, Object> main = (Map<String, Object>) response.get("main");
            List<Map<String, Object>> weatherList = (List<Map<String, Object>>) response.get("weather");
            Map<String, Object> wind = (Map<String, Object>) response.get("wind");

            Double temp = ((Number) main.get("temp")).doubleValue();
            Integer humidity = ((Number) main.get("humidity")).intValue();
            String description = weatherList.get(0).get("description").toString();
            String icon = weatherList.get(0).get("icon").toString();
            Double windSpeed = wind != null ? ((Number) wind.get("speed")).doubleValue() : 0.0;

            return new WeatherResponse(cityName, temp, description, humidity, windSpeed, icon);
        } catch (Exception e) {
            return getFallbackWeather(cityName);
        }
    }

    private WeatherResponse getFallbackWeather(String cityName) {
        return new WeatherResponse(cityName, 25.0, "Sunny / Mild", 60, 5.5, "01d");
    }
}
