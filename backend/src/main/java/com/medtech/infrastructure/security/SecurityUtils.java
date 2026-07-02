package com.medtech.infrastructure.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

/**
 * Helpers for accessing the current request's principal from anywhere
 * (services, audit aspects, controllers).
 *
 * Помошни методи за пристап до тековно најавениот корисник од безбедносниот контекст.
 */
public final class SecurityUtils {

    private SecurityUtils() {}

    public static Optional<Long> currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal() == null) {
            return Optional.empty();
        }
        Object principal = auth.getPrincipal();
        if (principal instanceof Long id) {
            return Optional.of(id);
        }
        if (principal instanceof AuthenticatedUser au) {
            return Optional.ofNullable(au.getId());
        }
        return Optional.empty();
    }

    public static Optional<String> currentUserRole() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            return Optional.empty();
        }
        return auth.getAuthorities().stream()
                .map(a -> a.getAuthority().replaceFirst("^ROLE_", ""))
                .findFirst();
    }

    public static boolean hasRole(String role) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().replaceFirst("^ROLE_", "").equals(role));
    }
}
