package org.acme.exception;

public class GestionnaireAlreadyExistsException extends RuntimeException {

    public GestionnaireAlreadyExistsException(String message) {
        super(message);
    }

    public GestionnaireAlreadyExistsException(String message, Throwable cause) {
        super(message, cause);
    }
}
