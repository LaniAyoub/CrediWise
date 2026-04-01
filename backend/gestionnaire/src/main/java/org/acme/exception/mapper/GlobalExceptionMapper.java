package org.acme.exception.mapper;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import org.acme.dto.ApiErrorResponse;
import org.acme.exception.*;

import java.time.Instant;
import java.util.Map;
import java.util.stream.Collectors;

@Provider
public class GlobalExceptionMapper implements ExceptionMapper<Throwable> {

    @Override
    public Response toResponse(Throwable exception) {
        if (exception instanceof WebApplicationException webApp) {
            return buildResponse(webApp.getResponse().getStatus(), webApp.getMessage(), webApp);
        }
        if (exception instanceof ConstraintViolationException violationException) {
            Map<String, String> details = violationException.getConstraintViolations().stream()
                    .collect(Collectors.toMap(v -> v.getPropertyPath().toString(), ConstraintViolation::getMessage));
            return buildResponse(Response.Status.BAD_REQUEST.getStatusCode(), "Validation failed", details, violationException);
        }
        if (exception instanceof GestionnaireNotFoundException || exception instanceof AgenceNotFoundException || exception instanceof RoleNotFoundException) {
            return buildResponse(Response.Status.NOT_FOUND.getStatusCode(), exception.getMessage(), exception);
        }
        if (exception instanceof GestionnaireAlreadyExistsException || exception instanceof AgenceAlreadyExistsException || exception instanceof RoleAlreadyExistsException) {
            return buildResponse(Response.Status.CONFLICT.getStatusCode(), exception.getMessage(), exception);
        }
        return buildResponse(Response.Status.INTERNAL_SERVER_ERROR.getStatusCode(), "Unexpected error", exception);
    }

    private Response buildResponse(int status, String message, Throwable exception) {
        return buildResponse(status, message, null, exception);
    }

    private Response buildResponse(int status, String message, Map<String, String> details, Throwable exception) {
        ApiErrorResponse payload = ApiErrorResponse.builder()
                .timestamp(Instant.now())
                .status(status)
                .error(exception.getClass().getSimpleName())
                .message(message)
                .details(details)
                .build();
        return Response.status(status).entity(payload).build();
    }
}

