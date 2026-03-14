package com.lifos.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Global Exception Handler — catches exceptions thrown anywhere in the app
 * and converts them into proper HTTP JSON responses.
 *
 * KEY CONCEPTS:
 * - @RestControllerAdvice → Spring scans this class and uses it for ALL controllers
 * - @ExceptionHandler → marks a method as the handler for a specific exception type
 * - ResponseEntity → lets you set both the HTTP status code AND the response body
 *
 * The API contract says errors should return: { "message": "..." }
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /** Handle 404 — Resource not found */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(Map.of("message", ex.getMessage()));
    }

    /** Handle 400 — Bad request / validation errors */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", ex.getMessage()));
    }

    /** Handle framework 404 for unmapped routes/static resources */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<Map<String, String>> handleNoResource(NoResourceFoundException ex) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(Map.of("message", ex.getMessage()));
    }

    /** Preserve explicit status codes thrown by services/controllers */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleResponseStatus(ResponseStatusException ex) {
        String message = ex.getReason() != null ? ex.getReason() : ex.getMessage();
        return ResponseEntity
                .status(ex.getStatusCode())
                .body(Map.of("message", message));
    }

    /** Handle 500 — Catch-all for unexpected errors */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGeneral(Exception ex) {
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Internal server error: " + ex.getMessage()));
    }
}
