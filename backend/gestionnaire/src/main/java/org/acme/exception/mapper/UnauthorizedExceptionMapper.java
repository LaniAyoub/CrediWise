package org.acme.exception.mapper;

import io.quarkus.security.UnauthorizedException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import org.jboss.logging.Logger;

/**
 * Maps UnauthorizedException to a safe 401 response.
 * Never leaks token content, stack traces, or internal URLs.
 */
@Provider
public class UnauthorizedExceptionMapper implements ExceptionMapper<UnauthorizedException> {

    private static final Logger LOG = Logger.getLogger(UnauthorizedExceptionMapper.class);

    @Override
    public Response toResponse(UnauthorizedException exception) {
        LOG.debugf("Unauthorized access attempt: %s", exception.getMessage());

        return Response.status(Response.Status.UNAUTHORIZED)
                .type(MediaType.APPLICATION_JSON)
                .entity("{\"error\":\"unauthorized\",\"message\":\"Authentication required\"}")
                .build();
    }
}
