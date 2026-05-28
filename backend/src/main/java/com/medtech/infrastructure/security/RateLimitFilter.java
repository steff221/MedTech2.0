package com.medtech.infrastructure.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Per-IP rate limiter for auth endpoints backed by Redis.
 * Limits: 10 requests / 60 seconds per IP on /api/auth/**.
 * Uses an atomic Lua script so the check-and-increment is race-free across replicas.
 */
public class RateLimitFilter extends OncePerRequestFilter {

    private static final int CAPACITY = 10;
    private static final int WINDOW_SECONDS = 60;

    // Atomic increment + conditional TTL: returns current count after increment.
    private static final RedisScript<Long> RATE_SCRIPT;
    static {
        DefaultRedisScript<Long> script = new DefaultRedisScript<>();
        script.setScriptText(
                "local c = redis.call('INCR', KEYS[1]) " +
                "if c == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end " +
                "return c");
        script.setResultType(Long.class);
        RATE_SCRIPT = script;
    }

    private final StringRedisTemplate redis;

    public RateLimitFilter(StringRedisTemplate redis) {
        this.redis = redis;
    }

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/api/auth/");
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain chain) throws ServletException, IOException {
        String key = "rl:auth:" + resolveClientIp(request);
        Long count = redis.execute(RATE_SCRIPT, List.of(key), String.valueOf(WINDOW_SECONDS));

        if (count != null && count <= CAPACITY) {
            chain.doFilter(request, response);
        } else {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write(
                    "{\"status\":429,\"code\":\"RATE_LIMITED\",\"message\":\"Too many requests. Please try again later.\"}");
        }
    }

    private String resolveClientIp(HttpServletRequest request) {
        // X-Real-IP is set by nginx from its own $remote_addr — cannot be spoofed by the client
        // because the backend port is not exposed to the host (compose-internal only).
        // X-Forwarded-For is intentionally NOT used: nginx appends to whatever the client sends,
        // so taking the first element is trivially bypassable.
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }
}
