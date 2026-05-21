package com.medtech.presentation.controller;

import com.medtech.application.dto.request.LoginRequest;
import com.medtech.application.dto.request.LogoutRequest;
import com.medtech.application.dto.request.RefreshTokenRequest;
import com.medtech.application.dto.request.RegisterRequest;
import com.medtech.application.dto.response.AuthResponse;
import com.medtech.application.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Register, login, refresh, logout")
@SecurityRequirements // no auth required
public class AuthController {

    private static final String REFRESH_COOKIE = "refresh_token";
    /** 7 days in seconds — matches JwtProperties.refreshTokenTtlDays default */
    private static final int COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

    private final AuthService authService;

    @Value("${medtech.security.cookie-secure:true}")
    private boolean secureCookie;

    @PostMapping("/register")
    @Operation(summary = "Self-register a PATIENT, DOCTOR, or NURSE account")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletResponse response) {
        AuthResponse auth = authService.register(request);
        setRefreshCookie(response, auth.refreshToken());
        return ResponseEntity.status(HttpStatus.CREATED).body(auth);
    }

    @PostMapping("/login")
    @Operation(summary = "Exchange email + password for access and refresh tokens")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {
        AuthResponse auth = authService.login(request);
        setRefreshCookie(response, auth.refreshToken());
        return ResponseEntity.ok(auth);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Exchange a refresh token for a fresh access + refresh pair")
    public ResponseEntity<AuthResponse> refresh(
            @CookieValue(name = REFRESH_COOKIE, required = false) String cookieToken,
            @RequestBody(required = false) RefreshTokenRequest bodyRequest,
            HttpServletResponse response) {
        // Cookie takes precedence; body kept for backward compatibility with non-browser clients.
        String token = cookieToken != null ? cookieToken
                : (bodyRequest != null ? bodyRequest.refreshToken() : null);
        if (token == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        AuthResponse auth = authService.refresh(new RefreshTokenRequest(token));
        setRefreshCookie(response, auth.refreshToken());
        return ResponseEntity.ok(auth);
    }

    @PostMapping("/logout")
    @Operation(summary = "Revoke the supplied refresh token so it cannot be reused")
    public ResponseEntity<Void> logout(
            @CookieValue(name = REFRESH_COOKIE, required = false) String cookieToken,
            @RequestBody(required = false) LogoutRequest bodyRequest,
            HttpServletResponse response) {
        String token = cookieToken != null ? cookieToken
                : (bodyRequest != null ? bodyRequest.refreshToken() : null);
        if (token != null) {
            authService.logout(new LogoutRequest(token));
        }
        clearRefreshCookie(response);
        return ResponseEntity.noContent().build();
    }

    private void setRefreshCookie(HttpServletResponse response, String token) {
        Cookie cookie = new Cookie(REFRESH_COOKIE, token);
        cookie.setHttpOnly(true);
        cookie.setSecure(secureCookie);
        cookie.setPath("/api/auth");
        cookie.setMaxAge(COOKIE_MAX_AGE_SECONDS);
        // SameSite=Strict prevents CSRF — set via header because Servlet Cookie API lacks it pre-Servlet 6.
        response.addCookie(cookie);
        response.addHeader("Set-Cookie",
                REFRESH_COOKIE + "=" + token
                + "; Path=/api/auth"
                + "; Max-Age=" + COOKIE_MAX_AGE_SECONDS
                + "; HttpOnly"
                + (secureCookie ? "; Secure" : "")
                + "; SameSite=Strict");
    }

    private void clearRefreshCookie(HttpServletResponse response) {
        response.addHeader("Set-Cookie",
                REFRESH_COOKIE + "="
                + "; Path=/api/auth"
                + "; Max-Age=0"
                + "; HttpOnly"
                + (secureCookie ? "; Secure" : "")
                + "; SameSite=Strict");
    }
}
