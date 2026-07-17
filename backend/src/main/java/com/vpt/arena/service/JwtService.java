package com.vpt.arena.service;

import com.vpt.arena.entity.User;
import com.vpt.arena.security.CustomUserDetails;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {
    private final SecretKey signingKey;
    private final long accessExpirySeconds;
    private final long refreshExpiryDays;

    public JwtService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-expiry-seconds:900}") long accessExpirySeconds,
            @Value("${jwt.refresh-expiry-days:7}") long refreshExpiryDays) {
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessExpirySeconds = accessExpirySeconds;
        this.refreshExpiryDays = refreshExpiryDays;
    }

    public String generateAccessToken(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
            .subject(user.getId().toString())
            .claim("email", user.getEmail())
            .claim("name", user.getName())
            .claim("role", user.getRole().name())
            .claim("type", "access")
            .id(UUID.randomUUID().toString())
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plusSeconds(accessExpirySeconds)))
            .signWith(signingKey)
            .compact();
    }

    public String generateRefreshToken(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
            .subject(user.getId().toString())
            .claim("email", user.getEmail())
            .claim("name", user.getName())
            .claim("type", "refresh")
            .id(UUID.randomUUID().toString())
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plusSeconds(refreshExpiryDays * 24 * 60 * 60)))
            .signWith(signingKey)
            .compact();
    }

    public Claims extractClaims(String token) {
        return Jwts.parser()
            .verifyWith(signingKey)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    public UUID extractUserId(String token) {
        return UUID.fromString(extractClaims(token).getSubject());
    }

    public String extractEmail(String token) {
        return extractClaims(token).get("email", String.class);
    }

    public long getAccessExpirySeconds() {
        return accessExpirySeconds;
    }

    public boolean isAccessTokenValid(String token, CustomUserDetails userDetails) {
        Claims claims = extractClaims(token);
        return "access".equals(claims.get("type", String.class))
            && userDetails.getId().toString().equals(claims.getSubject())
            && userDetails.getEmail().equals(claims.get("email", String.class))
            && claims.getExpiration().after(new Date());
    }

    public boolean isRefreshToken(String token) {
        Claims claims = extractClaims(token);
        return "refresh".equals(claims.get("type", String.class))
            && claims.getExpiration().after(new Date());
    }
}
