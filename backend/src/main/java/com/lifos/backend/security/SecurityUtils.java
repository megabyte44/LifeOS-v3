package com.lifos.backend.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Utility class for extracting the authenticated user's UID from Spring's SecurityContext.
 *
 * KEY CONCEPT:
 * - After FirebaseAuthenticationFilter runs, SecurityContextHolder holds
 *   an Authentication object whose "principal" is the Firebase UID (a String).
 * - Controllers call SecurityUtils.getCurrentUserUid() to get the uid
 *   without having to repeat the SecurityContextHolder boilerplate everywhere.
 *
 * USAGE IN CONTROLLERS:
 *   String uid = SecurityUtils.getCurrentUserUid();
 */
public final class SecurityUtils {

    private SecurityUtils() {} // Utility class — no instances

    /**
     * Returns the Firebase UID of the currently authenticated user.
     *
     * @throws IllegalStateException if called when no user is authenticated
     */
    public static String getCurrentUserUid() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new IllegalStateException("No authenticated user in SecurityContext");
        }
        return (String) auth.getPrincipal();
    }
}
