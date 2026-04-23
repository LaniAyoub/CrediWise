package org.acme.metrics;

import io.micrometer.core.instrument.*;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.math.BigDecimal;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Business metrics for the nouvelle_demande microservice.
 *
 * Exposed at GET /q/metrics (Prometheus format).
 * Scraped by SigNoz otel-collector every 15s → SigNoz Metrics tab.
 *
 * Metrics:
 *  demande_create_total{status, client_type, product_id}        — new credit requests
 *  demande_submit_total{status, product_id}                     — submissions DRAFT→SUBMITTED
 *  demande_validate_total{product_id, branch_id}                — validations SUBMITTED→VALIDATED
 *  demande_reject_total{product_id, branch_id}                  — rejections SUBMITTED→REJECTED
 *  demande_update_total{status}                                 — DRAFT updates
 *  demande_delete_total{status}                                 — DRAFT deletions
 *  demande_grpc_call_total{service, method, status}             — gRPC calls
 *  demande_requested_amount_sum                                 — DistributionSummary of credit amounts
 *  demande_operation_duration_seconds{operation, status}        — latency per operation
 *  demande_active_draft_count                                   — gauge: current DRAFT demandes
 *  demande_active_submitted_count                               — gauge: current SUBMITTED demandes
 */
@ApplicationScoped
public class DemandeMetrics {

    private final MeterRegistry registry;
    private final AtomicInteger draftCount     = new AtomicInteger(0);
    private final AtomicInteger submittedCount = new AtomicInteger(0);
    private final AtomicInteger validatedCount = new AtomicInteger(0);
    private final AtomicInteger rejectedCount  = new AtomicInteger(0);

    @Inject
    public DemandeMetrics(MeterRegistry registry) {
        this.registry = registry;
        Gauge.builder("demande.active_draft_count", draftCount, AtomicInteger::get)
                .description("Number of demandes in DRAFT status")
                .register(registry);
        Gauge.builder("demande.active_submitted_count", submittedCount, AtomicInteger::get)
                .description("Number of demandes in SUBMITTED (pending decision) status")
                .register(registry);
        Gauge.builder("demande.active_validated_count", validatedCount, AtomicInteger::get)
                .description("Number of demandes in VALIDATED status")
                .register(registry);
        Gauge.builder("demande.active_rejected_count", rejectedCount, AtomicInteger::get)
                .description("Number of demandes in REJECTED status")
                .register(registry);
    }

    // ------------------------------------------------------------------
    // Workflow transitions
    // ------------------------------------------------------------------

    public void recordCreate(String status, String clientType, String productId) {
        Counter.builder("demande.create_total")
                .description("New credit request creations")
                .tag("status",      status     != null ? status     : "unknown")
                .tag("client_type", clientType != null ? clientType : "unknown")
                .tag("product_id",  productId  != null ? productId  : "unknown")
                .register(registry).increment();
        if ("success".equals(status)) draftCount.incrementAndGet();
    }

    public void recordSubmit(String status, String productId) {
        Counter.builder("demande.submit_total")
                .description("Demande submissions (DRAFT → SUBMITTED)")
                .tag("status",     status    != null ? status    : "unknown")
                .tag("product_id", productId != null ? productId : "unknown")
                .register(registry).increment();
        if ("success".equals(status)) {
            draftCount.updateAndGet(v -> Math.max(0, v - 1));
            submittedCount.incrementAndGet();
        }
    }

    public void recordValidate(String productId, String branchId) {
        Counter.builder("demande.validate_total")
                .description("Demande validations (SUBMITTED → VALIDATED)")
                .tag("product_id", productId != null ? productId : "unknown")
                .tag("branch_id",  branchId  != null ? branchId  : "unknown")
                .register(registry).increment();
        submittedCount.updateAndGet(v -> Math.max(0, v - 1));
        validatedCount.incrementAndGet();
    }

    public void recordReject(String productId, String branchId) {
        Counter.builder("demande.reject_total")
                .description("Demande rejections (SUBMITTED → REJECTED)")
                .tag("product_id", productId != null ? productId : "unknown")
                .tag("branch_id",  branchId  != null ? branchId  : "unknown")
                .register(registry).increment();
        submittedCount.updateAndGet(v -> Math.max(0, v - 1));
        rejectedCount.incrementAndGet();
    }

    public void recordUpdate(String status) {
        Counter.builder("demande.update_total")
                .description("Demande DRAFT updates")
                .tag("status", status != null ? status : "unknown")
                .register(registry).increment();
    }

    public void recordDelete(String status) {
        Counter.builder("demande.delete_total")
                .description("Demande DRAFT deletions")
                .tag("status", status != null ? status : "unknown")
                .register(registry).increment();
        if ("success".equals(status)) draftCount.updateAndGet(v -> Math.max(0, v - 1));
    }

    // ------------------------------------------------------------------
    // Credit amount distribution (business analytics)
    // ------------------------------------------------------------------

    public void recordRequestedAmount(BigDecimal amount, String productId, String branchId) {
        if (amount == null) return;
        DistributionSummary.builder("demande.requested_amount")
                .description("Distribution of requested credit amounts by product and branch")
                .tag("product_id", productId != null ? productId : "unknown")
                .tag("branch_id",  branchId  != null ? branchId  : "unknown")
                .publishPercentiles(0.5, 0.75, 0.95, 0.99)
                .register(registry)
                .record(amount.doubleValue());
    }

    public void recordValidatedAmount(BigDecimal amount, String productId, String branchId) {
        if (amount == null) return;
        DistributionSummary.builder("demande.validated_amount")
                .description("Distribution of approved (validated) credit amounts by product and branch")
                .tag("product_id", productId != null ? productId : "unknown")
                .tag("branch_id",  branchId  != null ? branchId  : "unknown")
                .publishPercentiles(0.5, 0.75, 0.95, 0.99)
                .register(registry)
                .record(amount.doubleValue());
    }

    public void recordProcessingDuration(double durationHours, String productId, String branchId, String finalStatus) {
        DistributionSummary.builder("demande.processing_duration_hours")
                .description("End-to-end processing time from creation to final decision (hours)")
                .baseUnit("hours")
                .tag("product_id",   productId   != null ? productId   : "unknown")
                .tag("branch_id",    branchId    != null ? branchId    : "unknown")
                .tag("final_status", finalStatus != null ? finalStatus : "unknown")
                .publishPercentiles(0.5, 0.75, 0.95, 0.99)
                .register(registry)
                .record(durationHours);
    }

    // ------------------------------------------------------------------
    // gRPC calls
    // ------------------------------------------------------------------

    public void recordGrpcCall(String service, String method, String status) {
        Counter.builder("demande.grpc_call_total")
                .description("gRPC calls made by nouvelle_demande service")
                .tag("service", service != null ? service : "unknown")
                .tag("method",  method  != null ? method  : "unknown")
                .tag("status",  status  != null ? status  : "unknown")
                .register(registry).increment();
    }

    // ------------------------------------------------------------------
    // Latency
    // ------------------------------------------------------------------

    public void recordOperationDuration(Timer.Sample sample, String operation, String status) {
        sample.stop(Timer.builder("demande.operation_duration_seconds")
                .description("Demande operation latency")
                .tag("operation", operation != null ? operation : "unknown")
                .tag("status",    status    != null ? status    : "unknown")
                .publishPercentiles(0.5, 0.95, 0.99)
                .register(registry));
    }
}
