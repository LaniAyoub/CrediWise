package org.acme.exception.mapper;

import io.quarkus.logging.Log;
import jakarta.transaction.TransactionalException;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import org.acme.dto.ApiErrorResponse;
import org.acme.exception.ClientAlreadyExistsException;
import org.acme.exception.ClientNotFoundException;

import java.time.Instant;
import java.util.Map;
import java.util.stream.Collectors;

@Provider
public class GlobalExceptionMapper implements ExceptionMapper<Throwable> {

    @Override
    public Response toResponse(Throwable exception) {
        Log.errorf(exception, "GlobalExceptionMapper caught [%s]: %s", exception.getClass().getName(), exception.getMessage());

        // Narayana CDI @Transactional interceptor wraps exceptions in TransactionalException.
        // Unwrap to get the real cause so error mappers below work correctly.
        if (exception instanceof TransactionalException te && te.getCause() != null) {
            Log.infof("Unwrapping TransactionalException, root cause: [%s] %s",
                    te.getCause().getClass().getName(), te.getCause().getMessage());
            return toResponse(te.getCause());
        }

        if (exception instanceof WebApplicationException webApp) {
            return buildResponse(webApp.getResponse().getStatus(), webApp.getMessage(), exception);
        }
        if (exception instanceof ConstraintViolationException cv) {
            Map<String, String> details = cv.getConstraintViolations().stream()
                    .collect(Collectors.toMap(
                            v -> v.getPropertyPath().toString(),
                            ConstraintViolation::getMessage));
            return buildResponse(Response.Status.BAD_REQUEST.getStatusCode(), "Validation failed", details, exception);
        }
        if (exception instanceof ClientNotFoundException) {
            return buildResponse(Response.Status.NOT_FOUND.getStatusCode(), exception.getMessage(), exception);
        }
        if (exception instanceof ClientAlreadyExistsException) {
            return buildResponse(Response.Status.CONFLICT.getStatusCode(), exception.getMessage(), exception);
        }
        // Unwrap JPA PersistenceException — Hibernate wraps DB constraint violations here.
        if (exception instanceof jakarta.persistence.PersistenceException pe && pe.getCause() != null) {
            return toResponse(pe.getCause());
        }
        // DB-level constraint violation (org.hibernate.exception.ConstraintViolationException).
        // Check by class name to avoid a direct Hibernate import collision with the jakarta type.
        if (exception.getClass().getSimpleName().equals("ConstraintViolationException")
                && exception.getClass().getName().startsWith("org.hibernate")) {
            return buildResponse(Response.Status.CONFLICT.getStatusCode(),
                    "Data constraint violation", exception);
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
