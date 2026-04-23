package org.acme.logging;

import io.vertx.core.http.HttpServerRequest;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.ext.Provider;

import java.util.UUID;

@Provider
@ApplicationScoped
public class AuthRequestFilter implements ContainerRequestFilter {

    @Inject
    AuthRequestContext ctx;

    @Context
    HttpServerRequest vertxRequest;

    @Override
    public void filter(ContainerRequestContext request) {
        ctx.setRequestId(UUID.randomUUID().toString());
        ctx.setIpAddress(resolveIp(request));
        ctx.setUserAgent(request.getHeaderString("User-Agent"));
    }

    private String resolveIp(ContainerRequestContext request) {
        // Proxy headers first (reverse proxy / load balancer)
        String forwarded = request.getHeaderString("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        String realIp = request.getHeaderString("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp;
        }
        // Fall back to actual socket address via Vert.x
        if (vertxRequest != null && vertxRequest.remoteAddress() != null) {
            return vertxRequest.remoteAddress().hostAddress();
        }
        return "unknown";
    }
}
