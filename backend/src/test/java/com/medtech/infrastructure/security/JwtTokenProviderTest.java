package com.medtech.infrastructure.security;

import com.medtech.domain.entity.User;
import com.medtech.domain.vo.UserRole;
import com.medtech.domain.vo.UserStatus;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class JwtTokenProviderTest {

    private JwtTokenProvider provider;
    private User user;

    @BeforeEach
    void setUp() {
        JwtProperties props = new JwtProperties(
                "unit-test-secret-unit-test-secret-unit-test-secret",
                60, 7, "medtech-test");
        provider = new JwtTokenProvider(props);

        user = new User();
        user.setEmail("alice@example.com");
        user.setRole(UserRole.DOCTOR);
        user.setStatus(UserStatus.ACTIVE);
        // Reflection-free setter: User#id is generated, but JwtTokenProvider
        // only reads getId(); fake by simulating via persistence is overkill —
        // we set via the package-private getter equivalent below.
        try {
            var idField = User.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(user, 42L);
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException(e);
        }
    }

    @Test
    void issuesValidAccessTokenWithRoleClaim() {
        String token = provider.issueAccessToken(user);

        Optional<Claims> claims = provider.parse(token);

        assertThat(claims).isPresent();
        assertThat(claims.get().getSubject()).isEqualTo("42");
        assertThat(claims.get().get(JwtTokenProvider.CLAIM_ROLE, String.class)).isEqualTo("DOCTOR");
        assertThat(provider.isAccessToken(claims.get())).isTrue();
        assertThat(provider.isRefreshToken(claims.get())).isFalse();
    }

    @Test
    void issuesValidRefreshTokenWithRefreshType() {
        String token = provider.issueRefreshToken(user);

        Claims claims = provider.parse(token).orElseThrow();

        assertThat(provider.isRefreshToken(claims)).isTrue();
        assertThat(provider.isAccessToken(claims)).isFalse();
    }

    @Test
    void rejectsTamperedToken() {
        String token = provider.issueAccessToken(user);
        String tampered = token.substring(0, token.length() - 4) + "abcd";

        assertThat(provider.parse(tampered)).isEmpty();
    }

    @Test
    void rejectsGarbage() {
        assertThat(provider.parse("not.a.jwt")).isEmpty();
        assertThat(provider.parse("")).isEmpty();
    }
}
