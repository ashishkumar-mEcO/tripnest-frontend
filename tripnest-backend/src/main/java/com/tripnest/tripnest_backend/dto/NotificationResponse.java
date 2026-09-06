package com.tripnest.tripnest_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {
    private Integer id;
    private Integer recipientId;
    private String message;
    private String type;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
