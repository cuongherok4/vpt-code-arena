package com.vpt.arena.repository;

import com.vpt.arena.entity.FriendRequest;
import com.vpt.arena.entity.enums.FriendRequestStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FriendRequestRepository extends JpaRepository<FriendRequest, UUID> {
    boolean existsBySenderIdAndReceiverIdAndStatus(UUID senderId, UUID receiverId, FriendRequestStatus status);

    @EntityGraph(attributePaths = {"sender", "receiver"})
    Optional<FriendRequest> findBySenderIdAndReceiverIdAndStatus(UUID senderId, UUID receiverId, FriendRequestStatus status);

    @EntityGraph(attributePaths = {"sender", "receiver"})
    Optional<FriendRequest> findBySenderIdAndReceiverId(UUID senderId, UUID receiverId);

    @EntityGraph(attributePaths = {"sender", "receiver"})
    List<FriendRequest> findByReceiverIdAndStatusOrderByCreatedAtDesc(UUID receiverId, FriendRequestStatus status);

    @EntityGraph(attributePaths = {"sender", "receiver"})
    List<FriendRequest> findBySenderIdAndStatusOrderByCreatedAtDesc(UUID senderId, FriendRequestStatus status);

    @EntityGraph(attributePaths = {"sender", "receiver"})
    @Query("SELECT request FROM FriendRequest request WHERE request.id = :id")
    Optional<FriendRequest> findWithUsersById(@Param("id") UUID id);
}
