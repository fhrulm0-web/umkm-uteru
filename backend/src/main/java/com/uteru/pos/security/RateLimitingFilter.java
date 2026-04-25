package com.uteru.pos.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class RateLimitingFilter extends OncePerRequestFilter {
    private final ConcurrentMap<String, RateWindow> windows = new ConcurrentHashMap<>();
    private final int authMaxAttempts;
    private final Duration authWindow;
    private final int apiMaxRequests;
    private final Duration apiWindow;

    public RateLimitingFilter(
            @Value("${pos.security.rate-limit.auth.max-attempts:5}") int authMaxAttempts,
            @Value("${pos.security.rate-limit.auth.window:PT15M}") Duration authWindow,
            @Value("${pos.security.rate-limit.api.max-requests:300}") int apiMaxRequests,
            @Value("${pos.security.rate-limit.api.window:PT15M}") Duration apiWindow) {
        this.authMaxAttempts = authMaxAttempts;
        this.authWindow = authWindow;
        this.apiMaxRequests = apiMaxRequests;
        this.apiWindow = apiWindow;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();
        if (!path.startsWith("/api/") || "OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        Instant now = Instant.now();
        cleanupExpiredWindows(now);

        String clientKey = clientKey(request);
        RateResult apiResult = consume("api:" + clientKey, apiMaxRequests, apiWindow, now);
        if (!apiResult.allowed()) {
            writeTooManyRequests(response, "Too many API requests", apiMaxRequests, apiResult);
            return;
        }

        if (path.startsWith("/api/auth/")) {
            RateResult authResult = consume("auth:" + clientKey, authMaxAttempts, authWindow, now);
            if (!authResult.allowed()) {
                writeTooManyRequests(response, "Too many authentication attempts", authMaxAttempts, authResult);
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private RateResult consume(String key, int maxRequests, Duration window, Instant now) {
        RateWindow rateWindow = windows.computeIfAbsent(key, ignored -> new RateWindow(now.plus(window)));
        synchronized (rateWindow) {
            if (!now.isBefore(rateWindow.resetAt())) {
                rateWindow.reset(now.plus(window));
            }

            if (rateWindow.count() >= maxRequests) {
                return new RateResult(false, 0, rateWindow.resetAt());
            }

            rateWindow.increment();
            return new RateResult(true, maxRequests - rateWindow.count(), rateWindow.resetAt());
        }
    }

    private void cleanupExpiredWindows(Instant now) {
        if (windows.size() < 1_000) {
            return;
        }

        Iterator<Map.Entry<String, RateWindow>> iterator = windows.entrySet().iterator();
        while (iterator.hasNext()) {
            Map.Entry<String, RateWindow> entry = iterator.next();
            if (!now.isBefore(entry.getValue().resetAt())) {
                iterator.remove();
            }
        }
    }

    private String clientKey(HttpServletRequest request) {
        return request.getRemoteAddr() == null ? "unknown" : request.getRemoteAddr();
    }

    private void writeTooManyRequests(HttpServletResponse response,
                                      String message,
                                      int limit,
                                      RateResult result) throws IOException {
        long retryAfterSeconds = Math.max(1, Duration.between(Instant.now(), result.resetAt()).toSeconds());
        response.setStatus(429);
        response.setContentType("application/json");
        response.setHeader("Retry-After", Long.toString(retryAfterSeconds));
        response.setHeader("X-RateLimit-Limit", Integer.toString(limit));
        response.setHeader("X-RateLimit-Remaining", "0");
        response.setHeader("X-RateLimit-Reset", Long.toString(result.resetAt().getEpochSecond()));
        response.getWriter().write("{\"error\":\"rate_limited\",\"message\":\"" + message + "\"}");
    }

    private static final class RateWindow {
        private Instant resetAt;
        private int count;

        private RateWindow(Instant resetAt) {
            this.resetAt = resetAt;
        }

        private Instant resetAt() {
            return resetAt;
        }

        private int count() {
            return count;
        }

        private void increment() {
            count++;
        }

        private void reset(Instant nextResetAt) {
            this.resetAt = nextResetAt;
            this.count = 0;
        }
    }

    private record RateResult(boolean allowed, int remaining, Instant resetAt) {
    }
}
