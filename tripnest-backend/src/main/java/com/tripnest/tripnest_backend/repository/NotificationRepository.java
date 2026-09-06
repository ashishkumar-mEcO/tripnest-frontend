package com.tripnest.tripnest_backend.repository;

import com.tripnest.tripnest_backend.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {

    List<Notification> findByRecipientIdOrderByCreatedAtDesc(Integer recipientId);

    long countByRecipientIdAndIsReadFalse(Integer recipientId);

    boolean existsByRecipientIdAndMessageContaining(Integer recipientId, String keyword);
}
