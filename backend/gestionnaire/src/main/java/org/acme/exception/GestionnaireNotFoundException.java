package org.acme.exception;

public class GestionnaireNotFoundException extends RuntimeException {

    public GestionnaireNotFoundException(String message) {
        super(message);
    }

    public GestionnaireNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
