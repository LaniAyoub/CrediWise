package org.acme.exception;

/**
 * Thrown when a critical gRPC service is unavailable.
 * Result: HTTP 503 Service Unavailable
 */
public class ServiceUnavailableException extends RuntimeException {
    public ServiceUnavailableException(String message) {
        super(message);
    }

    public ServiceUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
