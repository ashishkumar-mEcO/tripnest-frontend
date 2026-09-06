package com.tripnest.tripnest_backend.repository;

import com.tripnest.tripnest_backend.entity.TripMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TripMemberRepository extends JpaRepository<TripMember, Integer> {

    List<TripMember> findByTripId(Integer tripId);

    List<TripMember> findByTripIdAndStatus(Integer tripId, String status);

    List<TripMember> findByUserIdAndStatus(Integer userId, String status);

    Optional<TripMember> findByTripIdAndUserId(Integer tripId, Integer userId);

    Optional<TripMember> findByTripIdAndUserEmail(Integer tripId, String userEmail);

    boolean existsByTripIdAndUserEmailAndStatus(Integer tripId, String userEmail, String status);

    boolean existsByTripIdAndUserIdAndStatus(Integer tripId, Integer userId, String status);

    boolean existsByTripIdAndUserEmail(Integer tripId, String userEmail);

    void deleteByTripId(Integer tripId);
}
