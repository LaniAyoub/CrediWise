package org.acme.grpc;

import io.grpc.CallOptions;
import io.grpc.Channel;
import io.grpc.ClientCall;
import io.grpc.ClientInterceptor;
import io.grpc.ForwardingClientCall.SimpleForwardingClientCall;
import io.grpc.Metadata;
import io.grpc.MethodDescriptor;
import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.jwt.JsonWebToken;

/**
 * Propagates the caller's JWT to outgoing gRPC calls so the downstream
 * service (gestionnaire) can authenticate and authorize the original user.
 *
 * Registered globally via {@code @GlobalInterceptor}.
 */
@ApplicationScoped
@io.quarkus.grpc.GlobalInterceptor
public class JwtPropagatingInterceptor implements ClientInterceptor {

    private static final Metadata.Key<String> AUTHORIZATION_KEY =
            Metadata.Key.of("authorization", Metadata.ASCII_STRING_MARSHALLER);

    @Inject
    JsonWebToken jwt;

    @Override
    public <ReqT, RespT> ClientCall<ReqT, RespT> interceptCall(
            MethodDescriptor<ReqT, RespT> method,
            CallOptions callOptions,
            Channel next) {

        return new SimpleForwardingClientCall<>(next.newCall(method, callOptions)) {
            @Override
            public void start(Listener<RespT> responseListener, Metadata headers) {
                if (jwt != null && jwt.getRawToken() != null) {
                    headers.put(AUTHORIZATION_KEY, "Bearer " + jwt.getRawToken());
                    Log.debugf("gRPC-out [%s]: JWT propagated (sub=%s)", method.getFullMethodName(), jwt.getSubject());
                } else {
                    Log.debugf("gRPC-out [%s]: no JWT available — unauthenticated call", method.getFullMethodName());
                }
                super.start(responseListener, headers);
            }
        };
    }
}
