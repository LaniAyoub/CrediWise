package org.acme.grpc;

import io.grpc.CallOptions;
import io.grpc.Channel;
import io.grpc.ClientCall;
import io.grpc.ClientInterceptor;
import io.grpc.ForwardingClientCall;
import io.grpc.Metadata;
import io.grpc.MethodDescriptor;
import io.quarkus.arc.Arc;
import io.quarkus.grpc.GlobalInterceptor;
import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.jwt.JsonWebToken;

/**
 * gRPC client interceptor that propagates the current Keycloak JWT
 * on every outgoing call as "Authorization: Bearer <token>".
 * Falls back gracefully when no JWT is present (internal/system calls).
 */
@ApplicationScoped
@GlobalInterceptor
public class JwtPropagatingInterceptor implements ClientInterceptor {

    static final Metadata.Key<String> AUTHORIZATION_KEY =
            Metadata.Key.of("authorization", Metadata.ASCII_STRING_MARSHALLER);

    @Override
    public <ReqT, RespT> ClientCall<ReqT, RespT> interceptCall(
            MethodDescriptor<ReqT, RespT> method, CallOptions callOptions, Channel next) {

        return new ForwardingClientCall.SimpleForwardingClientCall<>(next.newCall(method, callOptions)) {
            @Override
            public void start(Listener<RespT> responseListener, Metadata headers) {
                String token = resolveToken();
                if (token != null && !token.isBlank()) {
                    headers.put(AUTHORIZATION_KEY, "Bearer " + token);
                    Log.debugf("JWT propagated on gRPC call: %s (sub=%s)",
                            method.getFullMethodName(), extractSub(token));
                } else {
                    Log.debugf("No JWT available for gRPC call: %s", method.getFullMethodName());
                }
                super.start(responseListener, headers);
            }
        };
    }

    private String resolveToken() {
        try {
            JsonWebToken jwt = Arc.container().instance(JsonWebToken.class).get();
            return (jwt != null) ? jwt.getRawToken() : null;
        } catch (Exception e) {
            Log.debug("JwtPropagatingInterceptor: could not resolve JWT — " + e.getMessage());
            return null;
        }
    }

    /** Extract sub claim without logging the full token. */
    private String extractSub(String rawToken) {
        try {
            String[] parts = rawToken.split("\\.");
            if (parts.length < 2) return "unknown";
            String payload = new String(java.util.Base64.getUrlDecoder().decode(parts[1]));
            int subIdx = payload.indexOf("\"sub\":\"");
            if (subIdx < 0) return "unknown";
            int start = subIdx + 7;
            int end = payload.indexOf('"', start);
            return end > start ? payload.substring(start, end) : "unknown";
        } catch (Exception e) {
            return "unknown";
        }
    }
}
