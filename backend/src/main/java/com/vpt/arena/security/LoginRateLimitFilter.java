package com.vpt.arena.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class LoginRateLimitFilter extends OncePerRequestFilter {
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();
    private final int capacity;
    private final Duration window;

    public LoginRateLimitFilter(
            @Value("${security.rate-limit.login.capacity:5}") int capacity,
            @Value("${security.rate-limit.login.window-seconds:60}") long windowSeconds) {
        this.capacity = capacity;
        this.window = Duration.ofSeconds(windowSeconds);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !HttpMethod.POST.matches(request.getMethod())
            || !"/api/v1/auth/login".equals(request.getRequestURI());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        Bucket bucket = buckets.computeIfAbsent(clientKey(request), ignored -> newBucket());
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
        response.setHeader("X-Rate-Limit-Remaining", Long.toString(Math.max(probe.getRemainingTokens(), 0)));

        if (!probe.isConsumed()) {
            long retryAfterSeconds = Math.max(1, Duration.ofNanos(probe.getNanosToWaitForRefill()).toSeconds());
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setHeader("Retry-After", Long.toString(retryAfterSeconds));
            response.setContentType("application/json");
            response.getWriter().write("{\"message\":\"Too many login attempts. Please try again later.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private Bucket newBucket() {
        return Bucket.builder()
            .addLimit(Bandwidth.simple(capacity, window))
            .build();
    }

    private String clientKey(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
