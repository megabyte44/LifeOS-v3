package com.lifos.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

/**
 * CORS Configuration — allows the frontend to call our backend.
 *
 * KEY CONCEPT:
 * - Browsers enforce "Same-Origin Policy": by default, JavaScript on
 *   http://localhost:9002 (frontend) CANNOT make requests to
 *   http://localhost:8000 (backend) because they're different origins.
 * - CORS (Cross-Origin Resource Sharing) is the backend saying:
 *   "I allow requests from these specific origins."
 * - Without this config, every frontend API call would fail with a CORS error.
 *
 * @Configuration → tells Spring "this class contains bean definitions"
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")                         // Apply to all backend endpoints
                .allowedOrigins(
                    "http://localhost:9002",                // Frontend dev server
                    "http://localhost:3000" ,                // Alternative Next.js port
                    "https://frontend-lifeos-v3-git-punith-punithmedaramitta-1350s-projects.vercel.app/"         // Production frontend
                )
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")                       // Allow all headers (incl. Authorization)
                .allowCredentials(true)                     // Allow cookies/auth headers
                .maxAge(3600);                             // Cache preflight for 1 hour
    }
}
