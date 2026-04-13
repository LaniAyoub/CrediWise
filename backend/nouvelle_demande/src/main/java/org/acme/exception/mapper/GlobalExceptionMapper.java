package org.acme.exception.mapper;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import org.acme.dto.ApiErrorResponse;
import org.acme.exception.ClientNotFoundException;
import org.acme.exception.DemandeNotFoundException;

import java.time.Instant;
import java.util.Map;
import java.util.stream.Collectors;

@Provider
public class GlobalExceptionMapper implements ExceptionMapper<Throwable> {

    @Override
    public Response toResponse(Throwable exception) {
        if (exception instanceof WebApplicationException webApp) {
            return build(webApp.getResponse().getStatus(), webApp.getMessage(), null, exception);
        }
        if (exception instanceof ConstraintViolationException cv) {
            Map<String, String> details = cv.getConstraintViolations().stream()
                    .collect(Collectors.toMap(
                            v -> v.getPropertyPath().toString(),
                            ConstraintViolation::getMessage));
            return build(Response.Status.BAD_REQUEST.getStatusCode(), "Validation failed", details, exception);
        }
        if (exception instanceof DemandeNotFoundException) {
            return build(Response.Status.NOT_FOUND.getStatusCode(), exception.getMessage(), null, exception);
        }
        if (exception instanceof ClientNotFoundException) {
            return build(Response.Status.NOT_FOUND.getStatusCode(), exception.getMessage(), null, exception);
        }
        return build(Response.Status.INTERNAL_SERVER_ERROR.getStatusCode(), "Unexpected error", null, exception);
    }

    private Response build(int status, String message, Map<String, String> details, Throwable ex) {
        ApiErrorResponse payload = ApiErrorResponse.builder()
                .timestamp(Instant.now())
                .status(status)
                .error(ex.getClass().getSimpleName())
                .message(message)
                .details(details)
                .build();
        return Response.status(status).entity(payload).build();
    }
}
