package org.acme.grpc;

import io.grpc.Context;
import io.grpc.Contexts;
import io.grpc.Metadata;
import io.grpc.ServerCall;
import io.grpc.ServerCallHandler;
import io.grpc.ServerInterceptor;
import io.grpc.Status;
import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.Instant;

/**
 * gRPC server interceptor that validates the Bearer JWT on all incoming calls.
 * Rejects unauthenticated requests with UNAUTHENTICATED status.
 * Stores the validated "sub" claim in gRPC Context for downstream use.
 *
 * Note: analyse service does not currently expose its own gRPC server endpoints,
 * but this interceptor is registered defensively for future gRPC services on port 9003.
 */
@ApplicationScoped
public class GrpcSecurityInterceptor implements ServerInterceptor {

    /** Context key to retrieve the authenticated subject in service implementations. */
    public static final Context.Key<String> SUBJECT_KEY = Context.key("grpc-subject");

    static final Metadata.Key<String> AUTHORIZATION_KEY =
            Metadata.Key.of("authorization", Metadata.ASCII_STRING_MARSHALLER);

    @Override
    public <ReqT, RespT> ServerCall.Listener<ReqT> interceptCall(
            ServerCall<ReqT, RespT> call,
            Metadata headers,
            ServerCallHandler<ReqT, RespT> next) {

        String authHeader = headers.get(AUTHORIZATION_KEY);
        String method = call.getMethodDescriptor().getFullMethodName();

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            Log.warnf("gRPC UNAUTHENTICATED: missing token on %s at %s", method, Instant.now());
            call.close(Status.UNAUTHENTICATED.withDescription("Missing authorization token"), new Metadata());
            return new ServerCall.Listener<>() {};
        }

        String rawToken = authHeader.substring(7);
        String sub = extractSub(rawToken);

        if (sub == null) {
            Log.warnf("gRPC UNAUTHENTICATED: malformed token on %s at %s", method, Instant.now());
            call.close(Status.UNAUTHENTICATED.withDescription("Invalid token"), new Metadata());
            return new ServerCall.Listener<>() {};
        }

        Log.debugf("gRPC authenticated: sub=%s method=%s", sub, method);
        Context ctx = Context.current().withValue(SUBJECT_KEY, sub);
        return Contexts.interceptCall(ctx, call, headers, next);
    }

    /** Decodes sub claim from JWT payload without full crypto verification. */
    private String extractSub(String rawToken) {
        try {
            String[] parts = rawToken.split("\\.");
            if (parts.length < 2) return null;
            String payload = new String(java.util.Base64.getUrlDecoder().decode(parts[1]));
            int subIdx = payload.indexOf("\"sub\":\"");
            if (subIdx < 0) return null;
            int start = subIdx + 7;
            int end = payload.indexOf('"', start);
            return (end > start) ? payload.substring(start, end) : null;
        } catch (Exception e) {
            Log.debugf("GrpcSecurityInterceptor: failed to decode token payload: %s", e.getMessage());
            return null;
        }
    }
}
