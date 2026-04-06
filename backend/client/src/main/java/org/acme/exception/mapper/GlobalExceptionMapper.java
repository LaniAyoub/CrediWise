package org.acme.exception.mapper;

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
