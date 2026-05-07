package org.acme.grpc;

import io.grpc.Context;
import io.grpc.Contexts;
import io.grpc.Metadata;
import io.grpc.ServerCall;
import io.grpc.ServerCallHandler;
import io.grpc.ServerInterceptor;
import io.grpc.Status;
import io.quarkus.logging.Log;
import io.smallrye.jwt.auth.principal.JWTParser;
import io.smallrye.jwt.auth.principal.ParseException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.jwt.JsonWebToken;

/**
 * Server-side interceptor that validates JWT tokens on incoming gRPC calls.
 * <p>
 * Reads the "authorization" metadata key, strips the "Bearer " prefix,
 * parses and validates the token via SmallRye JWT, and stores the
 * authenticated principal in the gRPC {@link Context} for downstream use.
 * <p>
 * Returns UNAUTHENTICATED if the token is missing or invalid.
 */
@ApplicationScoped
public class GrpcSecurityInterceptor implements ServerInterceptor {

    public static final Context.Key<JsonWebToken> JWT_CONTEXT_KEY =
            Context.key("jwt-principal");

    private static final Metadata.Key<String> AUTHORIZATION_KEY =
            Metadata.Key.of("authorization", Metadata.ASCII_STRING_MARSHALLER);

    @Inject
    JWTParser jwtParser;

    @Override
    public <ReqT, RespT> ServerCall.Listener<ReqT> interceptCall(
            ServerCall<ReqT, RespT> call,
            Metadata headers,
            ServerCallHandler<ReqT, RespT> next) {

        String methodName = call.getMethodDescriptor().getFullMethodName();
        String authHeader = headers.get(AUTHORIZATION_KEY);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            Log.warnf("gRPC-in UNAUTHENTICATED [%s]: missing or malformed Authorization header", methodName);
            call.close(Status.UNAUTHENTICATED.withDescription("Missing or invalid authorization token"), new Metadata());
            return new ServerCall.Listener<>() {};
        }

        String rawToken = authHeader.substring("Bearer ".length());

        try {
            JsonWebToken token = jwtParser.parse(rawToken);
            Log.debugf("gRPC-in [%s]: authenticated sub=%s", methodName, token.getSubject());

            Context ctx = Context.current().withValue(JWT_CONTEXT_KEY, token);
            return Contexts.interceptCall(ctx, call, headers, next);

        } catch (ParseException e) {
            Log.warnf("gRPC-in UNAUTHENTICATED [%s]: token validation failed — %s", methodName, e.getMessage());
            call.close(Status.UNAUTHENTICATED.withDescription("Token validation failed"), new Metadata());
            return new ServerCall.Listener<>() {};
        }
    }
}
