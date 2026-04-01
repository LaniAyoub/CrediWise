package org.acme.exception;

public class AgenceNotFoundException extends RuntimeException {
    public AgenceNotFoundException(String message) {
        super(message);
    }
}

