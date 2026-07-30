package com.vpt.arena.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {
    private final StringRedisTemplate redisTemplate;

    @Value("${jwt.refresh-expiry-days:7}")
    private long refreshExpiryDays;

    public void save(UUID userId, String refreshToken) {
        redisTemplate.opsForValue().set(key(userId), refreshToken, Duration.ofDays(refreshExpiryDays));
    }

    public boolean matches(UUID userId, String refreshToken) {
        String stored = redisTemplate.opsForValue().get(key(userId));
        return stored != null && stored.equals(refreshToken);
    }

    public void revoke(UUID userId) {
        redisTemplate.delete(key(userId));
    }

    private String key(UUID userId) {
        return "session:refresh:" + userId;
    }
}
