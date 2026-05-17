package com.medtech.infrastructure.security;

import com.medtech.domain.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.Optional;

/**
 * Stateless JWT issuance and verification. Uses HS256 with a symmetric key
 * derived from {@link JwtProperties#secret()}.
 *
 * <p>Two token kinds:
 * <ul>
 *   <li>{@code access}  — short-lived, sent in {@code Authorization: Bearer}</li>
 *   <li>{@code refresh} — long-lived, used at {@code /api/auth/refresh}</li>
 * </ul>
 */
@Slf4j
@Component
public class JwtTokenProvider {

    public static final String CLAIM_ROLE = "role";
    public static final String CLAIM_TYPE = "typ";
    public static final String TYPE_ACCESS = "access";
    public static final String TYPE_REFRESH = "refresh";

    private final JwtProperties props;
    private final SecretKey key;

    public JwtTokenProvider(JwtProperties props) {
        this.props = props;
        this.key = Keys.hmacShaKeyFor(props.secret().getBytes(StandardCharsets.UTF_8));
    }

    public String issueAccessToken(User user) {
        return build(user, TYPE_ACCESS, Duration.ofMinutes(props.accessTokenTtlMinutes()));
    }

    public String issueRefreshToken(User user) {
        return build(user, TYPE_REFRESH, Duration.ofDays(props.refreshTokenTtlDays()));
    }

    public long accessTokenTtlSeconds() {
        return Duration.ofMinutes(props.accessTokenTtlMinutes()).toSeconds();
    }

    private String build(User user, String type, Duration ttl) {
        Instant now = Instant.now();
        return Jwts.builder()
                .issuer(props.issuer())
                .subject(user.getId().toString())
                .claims(Map.of(
                        "email", user.getEmail(),
                        CLAIM_ROLE, user.getRole().name(),
                        CLAIM_TYPE, type))
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(ttl)))
                .signWith(key, Jwts.SIG.HS256)
                .compact();
    }

    /** @return parsed claims when the token is valid; empty otherwise. */
    public Optional<Claims> parse(String token) {
        try {
            Jws<Claims> jws = Jwts.parser()
                    .verifyWith(key)
                    .requireIssuer(props.issuer())
                    .build()
                    .parseSignedClaims(token);
            return Optional.of(jws.getPayload());
        } catch (JwtException | IllegalArgumentException ex) {
            log.debug("Rejected JWT: {}", ex.getMessage());
            return Optional.empty();
        }
    }

    public boolean isAccessToken(Claims claims) {
        return TYPE_ACCESS.equals(claims.get(CLAIM_TYPE, String.class));
    }

    public boolean isRefreshToken(Claims claims) {
        return TYPE_REFRESH.equals(claims.get(CLAIM_TYPE, String.class));
    }
}
