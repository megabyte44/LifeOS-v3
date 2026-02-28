package com.lifos.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Spring Security Configuration.
 *
 * KEY CONCEPT:
 * - Spring Security intercepts EVERY HTTP request by default and blocks it
 *   unless you configure who can access what.
 * - SecurityFilterChain is where you define the rules:
 *   - Which paths are public vs authenticated
 *   - Session management (stateless for REST APIs)
 *   - CSRF protection (disabled for REST APIs that use Bearer tokens)
 *
 * PHASE 1: We PERMIT ALL requests (no auth yet) so we can test CRUD easily.
 * PHASE 2: We'll add the Firebase auth filter here.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Disable CSRF — REST APIs use Bearer tokens, not cookies
            .csrf(csrf -> csrf.disable())

            // Stateless sessions — no server-side session storage
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            // PHASE 1: Allow all requests (no authentication required)
            // PHASE 2: We'll change this to require auth for /api/**
            .authorizeHttpRequests(auth -> auth
                .anyRequest().permitAll()
            );

        return http.build();
    }
}
