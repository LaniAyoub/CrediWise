package org.acme.logging;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.ext.Provider;

import java.util.UUID;

@Provider
@ApplicationScoped
public class ClientRequestFilter implements ContainerRequestFilter {

    @Inject
    ClientRequestContext ctx;

    @Context
    io.vertx.core.http.HttpServerRequest vertxRequest;

    @Override
    public void filter(ContainerRequestContext requestContext) {
        ctx.setRequestId(UUID.randomUUID().toString());
        ctx.setUserAgent(requestContext.getHeaderString("User-Agent"));

        // Real socket IP — X-Forwarded-For → X-Real-IP → TCP socket
        String ip = requestContext.getHeaderString("X-Forwarded-For");
        if (ip != null && !ip.isBlank()) {
            ip = ip.split(",")[0].trim();
        } else {
            ip = requestContext.getHeaderString("X-Real-IP");
        }
        if ((ip == null || ip.isBlank()) && vertxRequest != null && vertxRequest.remoteAddress() != null) {
            ip = vertxRequest.remoteAddress().hostAddress();
        }
        ctx.setIpAddress(ip);
    }
}
