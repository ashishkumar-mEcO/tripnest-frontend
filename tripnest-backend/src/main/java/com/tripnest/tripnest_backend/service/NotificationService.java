package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.dto.NotificationResponse;
import com.tripnest.tripnest_backend.entity.Notification;
import com.tripnest.tripnest_backend.entity.User;
import com.tripnest.tripnest_backend.repository.NotificationRepository;
import com.tripnest.tripnest_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    /**
     * Helper method to create and persist a notification for a user,
     * and optionally send an email notification via JavaMailSender.
     */
    public Notification createNotification(User recipient, String message, String type) {
        if (recipient == null) return null;

        Notification notification = new Notification();
        notification.setRecipient(recipient);
        notification.setMessage(message);
        notification.setType(type);
        notification.setIsRead(false);
        notification.setCreatedAt(LocalDateTime.now());

        Notification saved = notificationRepository.save(notification);

        // Attempt sending email via JavaMailSender
        sendEmailNotificationSilently(recipient.getEmail(), "TripNest Notification: " + type, message);

        return saved;
    }

    private void sendEmailNotificationSilently(String toEmail, String subject, String body) {
        if (mailSender == null || toEmail == null || toEmail.isBlank()) {
            return;
        }

        try {
            SimpleMailMessage mailMessage = new SimpleMailMessage();
            mailMessage.setTo(toEmail);
            mailMessage.setSubject(subject);
            mailMessage.setText(body);
            mailSender.send(mailMessage);
        } catch (Exception e) {
            System.err.println("Email notification skipped/failed for " + toEmail + ": " + e.getMessage());
        }
    }

    public List<NotificationResponse> getMyNotifications(String userEmail) {
        User user = getUserByEmail(userEmail);
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public long getUnreadCount(String userEmail) {
        User user = getUserByEmail(userEmail);
        return notificationRepository.countByRecipientIdAndIsReadFalse(user.getId());
    }

    public NotificationResponse markAsRead(Integer notificationId, String userEmail) {
        User user = getUserByEmail(userEmail);
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));

        if (!notification.getRecipient().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only update your own notifications.");
        }

        notification.setIsRead(true);
        Notification saved = notificationRepository.save(notification);

        return mapToResponse(saved);
    }

    public void markAllAsRead(String userEmail) {
        User user = getUserByEmail(userEmail);
        List<Notification> userNotifications = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(user.getId());
        userNotifications.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(userNotifications);
    }

    private User getUserByEmail(String userEmail) {
        return userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private NotificationResponse mapToResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getRecipient() != null ? notification.getRecipient().getId() : null,
                notification.getMessage(),
                notification.getType(),
                notification.getIsRead(),
                notification.getCreatedAt()
        );
    }
}
