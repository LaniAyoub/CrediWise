package org.acme.service;

import io.micrometer.core.instrument.Timer;
import io.opentelemetry.api.trace.Span;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.acme.entity.enums.DemandeStatut;
import org.acme.logging.DemandeRequestContext;
import org.acme.metrics.DemandeMetrics;
import org.jboss.logging.Logger;
import org.jboss.logging.MDC;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

/**
 * Records demande business events to:
 *  1. OTel/SigNoz — via MDC attributes → Logs Explorer
 *  2. Prometheus metrics — via DemandeMetrics → SigNoz Metrics tab
 *
 * MDC filterable keys in SigNoz:
 *  demande.event = CREATED | SUBMITTED | VALIDATED | REJECTED | UPDATED | DELETED
 *  demande.status = SUCCESS | FAILED
 *  demande.product_id, demande.branch_id, demande.requested_amount, etc.
 */
@ApplicationScoped
public class DemandeEventService {

    private static final Logger log = Logger.getLogger("demande.events");

    @Inject DemandeRequestContext requestCtx;
    @Inject DemandeMetrics metrics;

    // -------------------------------------------------------------------------
    // Public API — called from DemandeService
    // -------------------------------------------------------------------------

    public void recordCreate(DemandeEventData data, Timer.Sample sample) {
        String status = data.success ? "success" : "failed";
        emitLog("CREATED", data, status);
        metrics.recordCreate(status, data.clientType, data.productId);
        if (data.requestedAmount != null && data.success) {
            metrics.recordRequestedAmount(data.requestedAmount, data.productId, data.branchId);
        }
        metrics.recordOperationDuration(sample, "create", status);
    }

    public void recordSubmit(DemandeEventData data, Timer.Sample sample) {
        String status = data.success ? "success" : "failed";
        emitLog("SUBMITTED", data, status);
        metrics.recordSubmit(status, data.productId);
        metrics.recordOperationDuration(sample, "submit", status);
    }

    public void recordStatusUpdate(DemandeEventData data, Timer.Sample sample) {
        String status = data.success ? "success" : "failed";
        String eventType = data.newStatus != null ? data.newStatus.name() : "STATUS_UPDATE";
        emitLog(eventType, data, status);
        if (data.success && data.newStatus != null) {
            if (data.newStatus == DemandeStatut.VALIDATED) {
                metrics.recordValidate(data.productId, data.branchId);
            } else if (data.newStatus == DemandeStatut.REJECTED) {
                metrics.recordReject(data.productId, data.branchId);
            }
        }
        if (data.success && data.newStatus != null && data.createdAt != null) {
            long minutes = ChronoUnit.MINUTES.between(data.createdAt, LocalDateTime.now());
            double durationHours = minutes / 60.0;
            if (data.newStatus == DemandeStatut.VALIDATED) {
                metrics.recordValidatedAmount(data.requestedAmount, data.productId, data.branchId);
            }
            metrics.recordProcessingDuration(durationHours, data.productId, data.branchId, data.newStatus.name());
        }
        metrics.recordOperationDuration(sample, "status_update", status);
    }

    public void recordUpdate(DemandeEventData data, Timer.Sample sample) {
        String status = data.success ? "success" : "failed";
        emitLog("UPDATED", data, status);
        metrics.recordUpdate(status);
        metrics.recordOperationDuration(sample, "update", status);
    }

    public void recordDelete(DemandeEventData data, Timer.Sample sample) {
        String status = data.success ? "success" : "failed";
        emitLog("DELETED", data, status);
        metrics.recordDelete(status);
        metrics.recordOperationDuration(sample, "delete", status);
    }

    public void recordGrpcCall(String service, String method, boolean success) {
        metrics.recordGrpcCall(service, method, success ? "success" : "failed");
    }

    // -------------------------------------------------------------------------
    // MDC-based structured log
    // -------------------------------------------------------------------------

    private void emitLog(String eventType, DemandeEventData d, String status) {
        try {
            // --- event ---
            mdcPut("demande.event",  eventType);
            mdcPut("demande.status", status);

            // --- demande identity ---
            mdcPut("demande.demande_id",  d.demandeId);
            mdcPut("demande.client_id",   d.clientId != null ? d.clientId.toString() : null);
            mdcPut("demande.client_type", d.clientType);

            // --- workflow ---
            mdcPut("demande.previous_status", d.previousStatus != null ? d.previousStatus.name() : null);
            mdcPut("demande.new_status",      d.newStatus      != null ? d.newStatus.name()      : null);

            // --- credit details ---
            mdcPut("demande.product_id",        d.productId);
            mdcPut("demande.requested_amount",  d.requestedAmount);
            mdcPut("demande.duration_months",   d.durationMonths);
            mdcPut("demande.cycle",             d.cycle);

            // --- organisation ---
            mdcPut("demande.branch_id",    d.branchId);
            mdcPut("demande.branch_name",  d.branchName);
            mdcPut("demande.manager_name", d.managerName);

            // --- failure ---
            mdcPut("demande.failure_reason", d.failureReason);

            // --- network ---
            mdcPut("demande.ip_address",  requestCtx.getIpAddress());
            mdcPut("demande.device_type", detectDeviceType(requestCtx.getUserAgent()));
            mdcPut("demande.os",          detectOs(requestCtx.getUserAgent()));
            mdcPut("demande.browser",     detectBrowser(requestCtx.getUserAgent()));

            // --- technical ---
            mdcPut("demande.response_time_ms", requestCtx.getElapsedMs());
            mdcPut("demande.request_id",       requestCtx.getRequestId());
            mdcPut("demande.trace_id",         currentTraceId());

            log.infof("demande_event event=%s status=%s demande_id=%d client_id=%s product=%s amount=%s branch=%s ip=%s response_ms=%d",
                    eventType, status, d.demandeId, d.clientId, d.productId,
                    d.requestedAmount, d.branchId, requestCtx.getIpAddress(), requestCtx.getElapsedMs());

        } finally {
            MDC.remove("demande.event");
            MDC.remove("demande.status");
            MDC.remove("demande.demande_id");
            MDC.remove("demande.client_id");
            MDC.remove("demande.client_type");
            MDC.remove("demande.previous_status");
            MDC.remove("demande.new_status");
            MDC.remove("demande.product_id");
            MDC.remove("demande.requested_amount");
            MDC.remove("demande.duration_months");
            MDC.remove("demande.cycle");
            MDC.remove("demande.branch_id");
            MDC.remove("demande.branch_name");
            MDC.remove("demande.manager_name");
            MDC.remove("demande.failure_reason");
            MDC.remove("demande.ip_address");
            MDC.remove("demande.device_type");
            MDC.remove("demande.os");
            MDC.remove("demande.browser");
            MDC.remove("demande.response_time_ms");
            MDC.remove("demande.request_id");
            MDC.remove("demande.trace_id");
        }
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private void mdcPut(String key, Object value) {
        if (value != null) MDC.put(key, value.toString());
    }

    private String currentTraceId() {
        String id = Span.current().getSpanContext().getTraceId();
        return "0000000000000000".equals(id) ? null : id;
    }

    private String detectDeviceType(String ua) {
        if (ua == null) return "UNKNOWN";
        String u = ua.toLowerCase();
        if (u.contains("mobile") || (u.contains("android") && !u.contains("tablet"))) return "MOBILE";
        if (u.contains("tablet") || u.contains("ipad")) return "TABLET";
        return "DESKTOP";
    }

    private String detectOs(String ua) {
        if (ua == null) return "UNKNOWN";
        String u = ua.toLowerCase();
        if (u.contains("windows")) return "Windows";
        if (u.contains("mac os"))  return "macOS";
        if (u.contains("android")) return "Android";
        if (u.contains("iphone") || u.contains("ipad")) return "iOS";
        if (u.contains("linux"))   return "Linux";
        return "UNKNOWN";
    }

    private String detectBrowser(String ua) {
        if (ua == null) return "UNKNOWN";
        String u = ua.toLowerCase();
        if (u.contains("edg/"))    return "Edge";
        if (u.contains("chrome"))  return "Chrome";
        if (u.contains("firefox")) return "Firefox";
        if (u.contains("safari"))  return "Safari";
        if (u.contains("opr/") || u.contains("opera")) return "Opera";
        return "UNKNOWN";
    }

    // -------------------------------------------------------------------------
    // Data carrier
    // -------------------------------------------------------------------------

    public static class DemandeEventData {
        public Long          demandeId;
        public LocalDateTime createdAt;
        public UUID          clientId;
        public String        clientType;
        public DemandeStatut previousStatus;
        public DemandeStatut newStatus;
        public String        productId;
        public BigDecimal    requestedAmount;
        public Integer       durationMonths;
        public String        cycle;
        public String        branchId;
        public String        branchName;
        public String        managerName;
        public boolean       success = true;
        public String        failureReason;
    }
}
