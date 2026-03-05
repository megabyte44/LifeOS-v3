package com.lifos.backend.config;

import com.lifos.backend.security.FirebaseAuthenticationFilter;
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
 *     /api/** → requires authentication (401 if no valid Bearer token)
 *     everything else → open (health checks, static assets, etc.)
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

            // All /api/** endpoints require a valid Firebase Bearer token
            .authorizeHttpRequests(auth -> auth
                // CORS preflight requests carry no auth token — must be permitted
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/api/**").authenticated()
                .anyRequest().permitAll()
            );

        return http.build();
    }
}
