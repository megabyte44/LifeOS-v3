package com.lifos.backend.config;

import com.lifos.backend.security.FirebaseAuthenticationFilter;
import jakarta.servlet.DispatcherType;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Spring Security Configuration — Phase 2: Firebase Auth enabled.
 *
 * KEY CONCEPTS:
 * - addFilterBefore(firebaseFilter, UsernamePasswordAuthenticationFilter.class)
 *     → Our Firebase filter runs BEFORE Spring's default auth filter.
 *     → Firebase verifies the token and sets the SecurityContext.
 *     → Spring's auth filter then sees an already-authenticated context.
 *
 * - authorizeHttpRequests:
 *     all non-health endpoints → require authentication (401 if no valid Bearer token)
 *     /health and CORS preflight OPTIONS requests → open
 */
@Configuration
@EnableWebSecurity
@org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
public class SecurityConfig {

    private final FirebaseAuthenticationFilter firebaseAuthFilter;

    public SecurityConfig(FirebaseAuthenticationFilter firebaseAuthFilter) {
        this.firebaseAuthFilter = firebaseAuthFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Enable CORS — delegates to the CorsRegistry in WebConfig
            .cors(Customizer.withDefaults())

            // Disable CSRF — REST APIs use Bearer tokens, not cookies
            .csrf(csrf -> csrf.disable())

            // Stateless sessions — no server-side session storage
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            // Add our Firebase filter before Spring's default auth filter
            .addFilterBefore(firebaseAuthFilter, UsernamePasswordAuthenticationFilter.class)

            // All non-health endpoints require a valid Firebase Bearer token
            .authorizeHttpRequests(auth -> auth
                // Async/error dispatches re-use the committed response — no re-auth needed
                .dispatcherTypeMatchers(DispatcherType.ASYNC, DispatcherType.ERROR).permitAll()
                // CORS preflight requests carry no auth token — must be permitted
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // Public health endpoint — used by the frontend connection logger, no auth needed
                .requestMatchers("/health").permitAll()
                .anyRequest().authenticated()
            );

        return http.build();
    }
}
