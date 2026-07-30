package com.vpt.arena.repository;

import com.vpt.arena.entity.User;
import org.springframework.data.domain.Page;
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
    Optional<User> findByPublicId(String publicId);
    boolean existsByEmail(String email);
    boolean existsByPublicId(String publicId);

    @Query("""
        SELECT u
        FROM User u
        WHERE :search IS NULL
          OR u.publicId = :search
          OR LOWER(u.name) LIKE LOWER(CONCAT('%', :search, '%'))
          OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))
        ORDER BY u.createdAt DESC
        """)
    Page<User> searchForAdmin(@Param("search") String search, Pageable pageable);

    @Query("""
        SELECT u
        FROM User u
        WHERE u.id <> :currentUserId
          AND (
            u.publicId = :query
            OR
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
