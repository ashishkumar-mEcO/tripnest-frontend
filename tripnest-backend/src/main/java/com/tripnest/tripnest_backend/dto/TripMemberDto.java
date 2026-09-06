package com.tripnest.tripnest_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TripMemberDto {
    private Integer id;
    private Integer tripId;
    private Integer userId;
    private String userName;
    private String userEmail;
    private String role; // MEMBER or GROUP_ADMIN
    private String status; // APPROVED, PENDING, REJECTED
    private LocalDateTime createdAt;
}
