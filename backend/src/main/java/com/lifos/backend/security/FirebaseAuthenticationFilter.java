package com.lifos.backend.security;

import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.lifos.backend.service.UserService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Firebase Authentication Filter — runs on every HTTP request.
 *
 * KEY CONCEPTS:
 * - OncePerRequestFilter → Spring guarantees this filter runs exactly once
 *   per request (important for forwarded requests).
 * - The flow:
 *     1. Extract "Authorization: Bearer <token>" header
 *     2. Verify the token with Firebase Admin SDK
 *     3. Extract uid, email, name from the verified token
 *     4. Auto-create user in DB if it's their first login
 *     5. Set authentication in Spring's SecurityContext
 *        → now SecurityContextHolder.getContext().getAuthentication() works
 *     6. Continue the filter chain (passes to the controller)
 *
 * - If no/invalid token: DO NOT set authentication → Spring Security will
 *   return 401 Unauthorized automatically for protected routes.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class FirebaseAuthenticationFilter extends OncePerRequestFilter {

    private final UserService userService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        // If no Bearer token, skip — SecurityConfig handles the 401
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String idToken = authHeader.substring(7); // Strip "Bearer " prefix

        // If Firebase is not initialized (missing service account), skip auth
        if (FirebaseApp.getApps().isEmpty()) {
            log.warn("Firebase not initialized — skipping token verification");
            filterChain.doFilter(request, response);
            return;
        }

        try {
            // Verify token with Firebase — throws if expired/invalid/revoked
            FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);

            String uid         = decodedToken.getUid();
            String email       = decodedToken.getEmail();
            String displayName = decodedToken.getName();
            String photoUrl    = decodedToken.getPicture();

            // Auto-create user in our DB on first login; returns entity with role
            var user = userService.ensureUserExists(uid, email, displayName, photoUrl);

            // Map DB role ("admin" / "user") to Spring Security authority
            String grantedRole = "admin".equalsIgnoreCase(user.getRole()) ? "ROLE_ADMIN" : "ROLE_USER";

            var authentication = new UsernamePasswordAuthenticationToken(
                    uid,
                    null,
                    List.of(new SimpleGrantedAuthority(grantedRole))
            );

            // Store in SecurityContext so controllers can retrieve it
            SecurityContextHolder.getContext().setAuthentication(authentication);

            log.debug("Authenticated user: {}", uid);

        } catch (FirebaseAuthException e) {
            // Invalid/expired token — clear context and let Spring return 401
            log.warn("Firebase token verification failed: {}", e.getMessage());
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}
