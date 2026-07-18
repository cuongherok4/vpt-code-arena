package com.vpt.arena.repository;

import com.vpt.arena.entity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    @Query("""
        SELECT u
        FROM User u
        WHERE u.id <> :currentUserId
          AND (
            LOWER(u.name) LIKE LOWER(CONCAT('%', :query, '%'))
            OR LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%'))
          )
        ORDER BY LOWER(u.name), LOWER(u.email)
        """)
    List<User> searchForFriends(
        @Param("currentUserId") UUID currentUserId,
        @Param("query") String query,
        Pageable pageable
    );
}
