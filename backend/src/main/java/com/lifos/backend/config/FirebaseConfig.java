package com.lifos.backend.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;

import jakarta.annotation.PostConstruct;
import java.io.IOException;

/**
 * Firebase Configuration — initializes the Firebase Admin SDK on startup.
 *
 * KEY CONCEPTS:
 * - @PostConstruct → the init() method runs ONCE immediately after Spring
 *   creates this bean. It's the right place to run one-time setup.
 * - GoogleCredentials.fromStream() → reads the service account JSON and
 *   creates credentials that let us call Firebase APIs from the backend.
 * - FirebaseApp.getApps().isEmpty() → guard against re-initialization on
 *   hot reload (Spring DevTools restarts the context).
 *
 * HOW TO GET YOUR SERVICE ACCOUNT:
 * 1. Go to https://console.firebase.google.com
 * 2. Project Settings → Service Accounts
 * 3. Click "Generate new private key"
 * 4. Save the JSON file as: src/main/resources/firebase-service-account.json
 */
@Configuration
public class FirebaseConfig {

    /**
     * Reads path from application.yaml:
     *   firebase.service-account-path: classpath:firebase-service-account.json
     *
     * Spring's Resource abstraction handles classpath: / file: prefixes.
     */
    @Value("${firebase.service-account-path}")
    private Resource serviceAccountResource;

    @PostConstruct
    public void init() throws IOException {
        if (FirebaseApp.getApps().isEmpty()) {
            GoogleCredentials credentials = GoogleCredentials
                    .fromStream(serviceAccountResource.getInputStream());

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(credentials)
                    .build();

            FirebaseApp.initializeApp(options);
        }
    }
}
