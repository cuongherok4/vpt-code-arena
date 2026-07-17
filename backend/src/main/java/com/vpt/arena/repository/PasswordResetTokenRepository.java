package com.vpt.arena.repository;

import com.vpt.arena.entity.PasswordResetToken;
import com.vpt.arena.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {
    Optional<PasswordResetToken> findByToken(String token);

    void deleteByUserAndUsedAtIsNull(User user);
}
