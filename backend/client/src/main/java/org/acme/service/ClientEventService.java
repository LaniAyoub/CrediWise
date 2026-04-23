package org.acme.service;

import io.micrometer.core.instrument.Timer;
import io.opentelemetry.api.trace.Span;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.acme.logging.ClientRequestContext;
import org.acme.metrics.ClientMetrics;
import org.jboss.logging.Logger;
import org.jboss.logging.MDC;

import java.util.UUID;

/**
 * Records client business events to:
 *  1. OTel/SigNoz — via MDC attributes on the log record (Logs Explorer)
 *  2. Prometheus metrics — via ClientMetrics (SigNoz Metrics tab)
 *
 * MDC keys become indexed attributes in ClickHouse logs_v2 →
 * filterable in SigNoz: client.event = 'CREATED', client.client_type = 'PHYSICAL', etc.
 */
@ApplicationScoped
public class ClientEventService {

    private static final Logger log = Logger.getLogger("client.events");

    @Inject ClientRequestContext requestCtx;
    @Inject ClientMetrics metrics;

    // -------------------------------------------------------------------------
    // Public API — called from ClientService
    // -------------------------------------------------------------------------

    public void recordCreate(ClientEventData data, Timer.Sample sample) {
        String status = data.success ? "success" : "failed";
        emitLog("CREATED", data, status);
        metrics.recordCreate(status, data.clientType, data.agenceId, data.segment);
        metrics.recordOperationDuration(sample, "create", status);
    }

    public void recordUpdate(ClientEventData data, Timer.Sample sample) {
        String status = data.success ? "success" : "failed";
        emitLog("UPDATED", data, status);
        metrics.recordUpdate(status);
        metrics.recordOperationDuration(sample, "update", status);
    }

    public void recordDelete(ClientEventData data, Timer.Sample sample) {
        String status = data.success ? "success" : "failed";
        emitLog("DELETED", data, status);
        metrics.recordDelete(status);
        metrics.recordOperationDuration(sample, "delete", status);
    }

    public void recordSearch(String searchType, boolean success, Timer.Sample sample) {
        String status = success ? "success" : "failed";
        metrics.recordSearch(searchType, status);
        metrics.recordOperationDuration(sample, "search_" + searchType, status);
    }

    public void recordGrpcCall(String service, String method, boolean success) {
        metrics.recordGrpcCall(service, method, success ? "success" : "failed");
    }

    // -------------------------------------------------------------------------
    // MDC-based structured log
    // -------------------------------------------------------------------------

    private void emitLog(String eventType, ClientEventData d, String status) {
        try {
            // --- identity ---
            mdcPut("client.event",       eventType);
            mdcPut("client.status",      status);
            mdcPut("client.client_id",   d.clientId != null ? d.clientId.toString() : null);
            mdcPut("client.client_type", d.clientType);
            mdcPut("client.status_value",d.clientStatus);
            mdcPut("client.national_id", d.nationalId);
            mdcPut("client.email",       d.email);
            mdcPut("client.segment",     d.segment);
            mdcPut("client.risk_level",  d.riskLevel);

            // --- organisation ---
            mdcPut("client.agence_id",    d.agenceId);
            mdcPut("client.manager_id",   d.managerId != null ? d.managerId.toString() : null);
            mdcPut("client.actor_id",     d.actorId   != null ? d.actorId.toString()   : null);

            // --- failure ---
            mdcPut("client.failure_reason", d.failureReason);

            // --- network ---
            mdcPut("client.ip_address",  requestCtx.getIpAddress());
            mdcPut("client.device_type", detectDeviceType(requestCtx.getUserAgent()));
            mdcPut("client.os",          detectOs(requestCtx.getUserAgent()));
            mdcPut("client.browser",     detectBrowser(requestCtx.getUserAgent()));

            // --- technical ---
            mdcPut("client.response_time_ms", requestCtx.getElapsedMs());
            mdcPut("client.request_id",       requestCtx.getRequestId());
            mdcPut("client.trace_id",         currentTraceId());

            log.infof("client_event event=%s status=%s client_id=%s client_type=%s agence=%s ip=%s response_ms=%d",
                    eventType, status, d.clientId, d.clientType,
                    d.agenceId, requestCtx.getIpAddress(), requestCtx.getElapsedMs());

        } finally {
            MDC.remove("client.event");
            MDC.remove("client.status");
            MDC.remove("client.client_id");
            MDC.remove("client.client_type");
            MDC.remove("client.status_value");
            MDC.remove("client.national_id");
            MDC.remove("client.email");
            MDC.remove("client.segment");
            MDC.remove("client.risk_level");
            MDC.remove("client.agence_id");
            MDC.remove("client.manager_id");
            MDC.remove("client.actor_id");
            MDC.remove("client.failure_reason");
            MDC.remove("client.ip_address");
            MDC.remove("client.device_type");
            MDC.remove("client.os");
            MDC.remove("client.browser");
            MDC.remove("client.response_time_ms");
            MDC.remove("client.request_id");
            MDC.remove("client.trace_id");
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

    public static class ClientEventData {
        public UUID   clientId;
        public String clientType;
        public String clientStatus;
        public String nationalId;
        public String email;
        public String segment;
        public String riskLevel;
        public String agenceId;
        public UUID   managerId;
        public UUID   actorId;
        public boolean success = true;
        public String failureReason;
    }
}
