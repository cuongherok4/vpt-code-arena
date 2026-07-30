package com.vpt.arena.repository;

import com.vpt.arena.entity.EmailVerifyToken;
import com.vpt.arena.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface EmailVerifyTokenRepository extends JpaRepository<EmailVerifyToken, UUID> {
    Optional<EmailVerifyToken> findByToken(String token);

    void deleteByUser(User user);
}
