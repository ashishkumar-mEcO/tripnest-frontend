package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.entity.*;
import com.tripnest.tripnest_backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReminderSchedulerService {

    private final TripRepository tripRepository;
    private final TripMemberRepository tripMemberRepository;
    private final ActivityRepository activityRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;

    /**
     * Scheduled daily at 8:00 AM to send upcoming trip and activity reminders.
     */
    @Scheduled(cron = "0 0 8 * * ?")
    @Transactional
    public void runDailyReminders() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        sendUpcomingTripReminders(tomorrow);
        sendActivityReminders(tomorrow);
    }

    public void sendUpcomingTripReminders(LocalDate targetDate) {
        List<Trip> allTrips = tripRepository.findAll();
        for (Trip trip : allTrips) {
            if (trip.getStartDate() != null && trip.getStartDate().equals(targetDate)) {
                List<User> recipients = getTripRecipients(trip);
                for (User user : recipients) {
                    String msgKey = "starts on " + trip.getStartDate() + " (Trip #" + trip.getId() + ")";
                    String message = "Reminder: Your trip '" + trip.getTitle() + "' starts on " + trip.getStartDate() + " (Trip #" + trip.getId() + ")!";
                    if (!notificationRepository.existsByRecipientIdAndMessageContaining(user.getId(), msgKey)) {
                        notificationService.createNotification(user, message, "TRIP_REMINDER");
                    }
                }
            }
        }
    }

    public void sendActivityReminders(LocalDate targetDate) {
        List<Activity> allActivities = activityRepository.findAll();
        for (Activity act : allActivities) {
            Itinerary itinerary = act.getItinerary();
            if (itinerary == null || itinerary.getTrip() == null) continue;

            LocalDate actDate = itinerary.getItineraryDate();
            if (actDate == null && itinerary.getTrip().getStartDate() != null && itinerary.getDayNumber() != null) {
                actDate = itinerary.getTrip().getStartDate().plusDays(itinerary.getDayNumber() - 1);
            }

            if (actDate != null && actDate.equals(targetDate)) {
                List<User> recipients = getTripRecipients(itinerary.getTrip());
                for (User user : recipients) {
                    String msgKey = "Activity '" + act.getActivityName() + "' on " + actDate;
                    String timeStr = act.getStartTime() != null ? act.getStartTime().toString() : "scheduled time";
                    String message = "Activity Reminder: Activity '" + act.getActivityName() + "' on " + actDate + " at " + timeStr + "!";
                    if (!notificationRepository.existsByRecipientIdAndMessageContaining(user.getId(), msgKey)) {
                        notificationService.createNotification(user, message, "ACTIVITY_REMINDER");
                    }
                }
            }
        }
    }

    private List<User> getTripRecipients(Trip trip) {
        List<User> users = new ArrayList<>();
        if (trip.getOwner() != null) {
            users.add(trip.getOwner());
        }
        tripMemberRepository.findByTripIdAndStatus(trip.getId(), "APPROVED").forEach(tm -> {
            if (tm.getUser() != null && !users.contains(tm.getUser())) {
                users.add(tm.getUser());
            }
        });
        return users;
    }
}
