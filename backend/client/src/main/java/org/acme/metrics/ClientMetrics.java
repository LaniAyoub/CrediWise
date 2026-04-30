package org.acme.metrics;

import io.micrometer.core.instrument.*;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.acme.grpc.GestionnaireGrpcClient;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Business metrics for the client microservice.
 *
 * Gauges read directly from DB on every Prometheus scrape (every 15s) — always accurate.
 *
 * Metrics:
 *  client_total_count                                 — total clients in DB
 *  client_active_count                                — clients with status ACTIVE
 *  client_active_prospect_count                       — clients with status PROSPECT
 *  client_create_total{status, client_type, agence_id, segment}
 *  client_update_total{status}
 *  client_delete_total{status}
 *  client_search_total{type, status}
 *  client_grpc_call_total{service, method, status}
 *  client_operation_duration_seconds{operation, status}
 */
@ApplicationScoped
public class ClientMetrics {

    private final MeterRegistry registry;
    private final ClientDbStats dbStats;
    private final GestionnaireGrpcClient grpcClient;
    private final MultiGauge    clientsByAgence;
    private final MultiGauge    clientsByType;
    private final MultiGauge    clientsBySegment;
    private final MultiGauge    clientsByManager;
    private final Map<String, String> managerEmailCache = new ConcurrentHashMap<>();

    @Inject
    public ClientMetrics(MeterRegistry registry, ClientDbStats dbStats, GestionnaireGrpcClient grpcClient) {
        this.registry   = registry;
        this.dbStats    = dbStats;
        this.grpcClient = grpcClient;

        Gauge.builder("client.total_count", dbStats, ClientDbStats::totalCount)
                .description("Total number of clients in database")
                .register(registry);

        Gauge.builder("client.active_prospect_count", dbStats, ClientDbStats::prospectCount)
                .description("Number of clients with PROSPECT status")
                .register(registry);

        Gauge.builder("client.active_count", dbStats, ClientDbStats::activeCount)
                .description("Number of clients with ACTIVE status")
                .register(registry);

        clientsByAgence = MultiGauge.builder("client.count_by_agence")
                .description("Number of clients per agency — DB-backed")
                .register(registry);

        clientsByType = MultiGauge.builder("client.count_by_type")
                .description("Number of clients per type — DB-backed")
                .register(registry);

        clientsBySegment = MultiGauge.builder("client.count_by_segment")
                .description("Number of clients per segment — DB-backed")
                .register(registry);

        clientsByManager = MultiGauge.builder("client.count_by_manager")
                .description("Number of clients per manager email — DB-backed")
                .register(registry);
    }

    @Scheduled(every = "30s", delayed = "5s")
    void syncAllCounts() {
        clientsByAgence.register(
                dbStats.countByAgence().entrySet().stream()
                        .map(e -> MultiGauge.Row.of(Tags.of("agence_id", e.getKey()), e.getValue().doubleValue()))
                        .collect(Collectors.toList()),
                true
        );
        clientsByType.register(
                dbStats.countByType().entrySet().stream()
                        .map(e -> MultiGauge.Row.of(Tags.of("client_type", e.getKey()), e.getValue().doubleValue()))
                        .collect(Collectors.toList()),
                true
        );
        clientsBySegment.register(
                dbStats.countBySegment().entrySet().stream()
                        .map(e -> MultiGauge.Row.of(Tags.of("segment", e.getKey()), e.getValue().doubleValue()))
                        .collect(Collectors.toList()),
                true
        );

        clientsByManager.register(
                dbStats.countByManagerId().entrySet().stream()
                        .map(e -> {
                            String email = resolveManagerEmail(e.getKey());
                            return MultiGauge.Row.of(Tags.of("manager_email", email), e.getValue().doubleValue());
                        })
                        .collect(Collectors.toList()),
                true
        );
    }

    private String resolveManagerEmail(String managerId) {
        return managerEmailCache.computeIfAbsent(managerId, id -> {
            try {
                var response = grpcClient.getGestionnaire(id);
                if (response.getFound() && !response.getEmail().isBlank()) {
                    return response.getEmail();
                }
            } catch (Exception ignored) {
                // gestionnaire service unavailable — fall back to UUID
            }
            return id;
        });
    }

    // ------------------------------------------------------------------
    // CRUD operations
    // ------------------------------------------------------------------

    public void recordCreate(String status, String clientType, String agenceId, String segment, String managerId) {
        Counter.builder("client.create_total")
                .description("Client creation attempts")
                .tag("status",      status     != null ? status     : "unknown")
                .tag("client_type", clientType != null ? clientType : "unknown")
                .tag("agence_id",   agenceId   != null ? agenceId   : "unknown")
                .tag("segment",     segment    != null ? segment    : "unknown")
                .tag("manager_email", managerId != null ? managerId : "unknown")
                .register(registry).increment();
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
