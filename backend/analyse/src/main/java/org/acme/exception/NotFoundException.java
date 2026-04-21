package org.acme.exception;

/**
 * Thrown when a resource (client, dossier, etc.) is not found.
 * Result: HTTP 404 Not Found
 */
public class NotFoundException extends RuntimeException {
    public NotFoundException(String message) {
        super(message);
    }

    public NotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
