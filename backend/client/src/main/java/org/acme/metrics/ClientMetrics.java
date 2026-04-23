package org.acme.metrics;

import io.micrometer.core.instrument.*;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.concurrent.atomic.AtomicInteger;

/**
 * Business metrics for the client microservice.
 *
 * Exposed at GET /q/metrics (Prometheus format).
 * Scraped by SigNoz otel-collector every 15s → SigNoz Metrics tab.
 *
 * Metrics:
 *  client_create_total{status, client_type, agence_id, segment} — creation attempts
 *  client_update_total{status}                        — update attempts
 *  client_delete_total{status}                        — deletion attempts
 *  client_search_total{type, status}                  — searches
 *  client_grpc_call_total{service, method, status}    — gRPC calls to gestionnaire
 *  client_operation_duration_seconds{operation,status}— latency per operation
 *  client_active_prospect_count                       — gauge: current PROSPECT clients
 */
@ApplicationScoped
public class ClientMetrics {

    private final MeterRegistry registry;
    private final AtomicInteger prospectCount = new AtomicInteger(0);

    @Inject
    public ClientMetrics(MeterRegistry registry) {
        this.registry = registry;
        Gauge.builder("client.active_prospect_count", prospectCount, AtomicInteger::get)
                .description("Number of clients in PROSPECT status currently tracked")
                .register(registry);
    }

    // ------------------------------------------------------------------
    // CRUD operations
    // ------------------------------------------------------------------

    public void recordCreate(String status, String clientType, String agenceId, String segment) {
        Counter.builder("client.create_total")
                .description("Client creation attempts")
                .tag("status",      status     != null ? status     : "unknown")
                .tag("client_type", clientType != null ? clientType : "unknown")
                .tag("agence_id",   agenceId   != null ? agenceId   : "unknown")
                .tag("segment",     segment    != null ? segment    : "unknown")
                .register(registry).increment();
        if ("success".equals(status)) prospectCount.incrementAndGet();
    }

    public void recordUpdate(String status) {
        Counter.builder("client.update_total")
                .description("Client update attempts")
                .tag("status", status != null ? status : "unknown")
                .register(registry).increment();
    }

    public void recordDelete(String status) {
        Counter.builder("client.delete_total")
                .description("Client deletion attempts")
                .tag("status", status != null ? status : "unknown")
                .register(registry).increment();
        if ("success".equals(status)) prospectCount.updateAndGet(v -> Math.max(0, v - 1));
    }

    public void recordSearch(String searchType, String status) {
        Counter.builder("client.search_total")
                .description("Client search operations")
                .tag("type",   searchType != null ? searchType : "unknown")
                .tag("status", status     != null ? status     : "unknown")
                .register(registry).increment();
    }

    // ------------------------------------------------------------------
    // gRPC calls
    // ------------------------------------------------------------------

    public void recordGrpcCall(String service, String method, String status) {
        Counter.builder("client.grpc_call_total")
                .description("gRPC calls made by client service")
                .tag("service", service != null ? service : "unknown")
                .tag("method",  method  != null ? method  : "unknown")
                .tag("status",  status  != null ? status  : "unknown")
                .register(registry).increment();
    }

    // ------------------------------------------------------------------
    // Latency
    // ------------------------------------------------------------------

    public void recordOperationDuration(Timer.Sample sample, String operation, String status) {
        sample.stop(Timer.builder("client.operation_duration_seconds")
                .description("Client operation latency")
                .tag("operation", operation != null ? operation : "unknown")
                .tag("status",    status    != null ? status    : "unknown")
                .publishPercentiles(0.5, 0.95, 0.99)
                .register(registry));
    }
}
