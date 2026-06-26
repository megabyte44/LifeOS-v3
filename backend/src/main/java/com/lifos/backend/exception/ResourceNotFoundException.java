package com.lifos.backend.exception;

/**
 * Custom exception for "404 Not Found" scenarios.
 *
 * KEY CONCEPT:
 * - RuntimeException = unchecked exception (no need to declare "throws" everywhere)
 * - We throw this in the Service layer when an entity isn't found
 * - The GlobalExceptionHandler catches it and returns HTTP 404
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s not found with %s: '%s'", resourceName, fieldName, fieldValue));
    }
}
