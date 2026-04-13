package org.acme.exception;

public class DemandeNotFoundException extends RuntimeException {
    public DemandeNotFoundException(String message) {
        super(message);
    }
}
