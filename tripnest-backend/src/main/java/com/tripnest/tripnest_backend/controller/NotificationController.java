package com.tripnest.tripnest_backend.controller;

import com.tripnest.tripnest_backend.dto.NotificationResponse;
import com.tripnest.tripnest_backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final com.tripnest.tripnest_backend.service.ReminderSchedulerService reminderSchedulerService;

    @PostMapping("/reminders/trigger")
    public Map<String, String> triggerReminders() {
        reminderSchedulerService.runDailyReminders();
        return Map.of("message", "Daily trip and activity reminders executed successfully.");
    }

    @GetMapping
    public List<NotificationResponse> getMyNotifications(Authentication authentication) {
        return notificationService.getMyNotifications(authentication.getName());
    }

    @GetMapping("/unread-count")
    public Map<String, Long> getUnreadCount(Authentication authentication) {
        long count = notificationService.getUnreadCount(authentication.getName());
        return Map.of("unreadCount", count);
    }

    @PutMapping("/{id}/read")
    public NotificationResponse markAsRead(@PathVariable Integer id, Authentication authentication) {
        return notificationService.markAsRead(id, authentication.getName());
    }

    @PutMapping("/read-all")
    public Map<String, String> markAllAsRead(Authentication authentication) {
        notificationService.markAllAsRead(authentication.getName());
        return Map.of("message", "All notifications marked as read.");
    }
}
