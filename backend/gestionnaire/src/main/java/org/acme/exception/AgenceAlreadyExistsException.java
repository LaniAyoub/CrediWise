package org.acme.exception;

public class AgenceAlreadyExistsException extends RuntimeException {
    public AgenceAlreadyExistsException(String message) {
        super(message);
    }
}

