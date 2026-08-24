package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.dto.ActivityRequest;
import com.tripnest.tripnest_backend.dto.ActivityResponse;
import com.tripnest.tripnest_backend.entity.Activity;
import com.tripnest.tripnest_backend.entity.Itinerary;
import com.tripnest.tripnest_backend.repository.ActivityRepository;
import com.tripnest.tripnest_backend.repository.ItineraryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ActivityService {

    private final ActivityRepository activityRepository;
    private final ItineraryRepository itineraryRepository;

    public ActivityResponse createActivity(Integer itineraryId, ActivityRequest request, String userEmail) {
        Itinerary itinerary = itineraryRepository.findById(itineraryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Itinerary not found"));

        if (!itinerary.getTrip().getOwner().getEmail().equals(userEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        Activity activity = new Activity();
        activity.setItinerary(itinerary);
        activity.setActivityName(request.getActivityName());
        activity.setActivityType(request.getActivityType());
        activity.setStartTime(request.getStartTime());
        activity.setEndTime(request.getEndTime());
        activity.setLocation(request.getLocation());
        activity.setDescription(request.getDescription());
        activity.setReminder(request.getReminder() != null ? request.getReminder() : false);

        Activity saved = activityRepository.save(activity);
        return mapToResponse(saved);
    }

    public List<ActivityResponse> getActivitiesByItineraryId(Integer itineraryId, String userEmail) {
        Itinerary itinerary = itineraryRepository.findById(itineraryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Itinerary not found"));

        if (!itinerary.getTrip().getOwner().getEmail().equals(userEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        return activityRepository.findByItineraryIdOrderByStartTimeAsc(itineraryId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ActivityResponse updateActivity(Integer activityId, ActivityRequest request, String userEmail) {
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Activity not found"));

        if (!activity.getItinerary().getTrip().getOwner().getEmail().equals(userEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        activity.setActivityName(request.getActivityName());
        activity.setActivityType(request.getActivityType());
        activity.setStartTime(request.getStartTime());
        activity.setEndTime(request.getEndTime());
        activity.setLocation(request.getLocation());
        activity.setDescription(request.getDescription());
        if (request.getReminder() != null) {
            activity.setReminder(request.getReminder());
        }

        Activity updated = activityRepository.save(activity);
        return mapToResponse(updated);
    }

    public void deleteActivity(Integer activityId, String userEmail) {
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Activity not found"));

        if (!activity.getItinerary().getTrip().getOwner().getEmail().equals(userEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        activityRepository.delete(activity);
    }

    private ActivityResponse mapToResponse(Activity activity) {
        return new ActivityResponse(
                activity.getId(),
                activity.getItinerary().getId(),
                activity.getActivityName(),
                activity.getActivityType(),
                activity.getStartTime(),
                activity.getEndTime(),
                activity.getLocation(),
                activity.getDescription(),
                activity.getReminder(),
                activity.getCreatedAt(),
                activity.getUpdatedAt()
        );
    }
}
