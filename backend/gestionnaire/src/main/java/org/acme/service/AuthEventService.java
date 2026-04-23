package org.acme.service;

import io.micrometer.core.instrument.Timer;
import io.opentelemetry.api.trace.Span;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.acme.entity.AuthEvent;
import org.acme.logging.AuthRequestContext;
import org.acme.metrics.AppMetrics;
import org.jboss.logging.Logger;
import org.jboss.logging.MDC;

import java.time.Instant;
import java.util.UUID;

/**
 * Records authentication events to:
 *   1. PostgreSQL  — business persistence, KPI queries, audits
 *   2. OTel/SigNoz — via MDC attributes on the log record (queryable in Logs Explorer)
 *
 * MDC keys become indexed attributes in ClickHouse logs_v2, so they are
 * filterable in SigNoz: auth.event = 'LOGIN', auth.status = 'FAILED', etc.
 */
@ApplicationScoped
public class AuthEventService {

    private static final Logger log = Logger.getLogger("auth.events");

    @Inject
    AuthRequestContext requestCtx;

    @Inject
    AppMetrics metrics;

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    @Transactional
    public void recordLogin(LoginEventData data) {
        Timer.Sample timerSample = Timer.start();
        String traceId    = currentTraceId();
        String deviceType = detectDeviceType(requestCtx.getUserAgent());
        String os         = detectOs(requestCtx.getUserAgent());
        String browser    = detectBrowser(requestCtx.getUserAgent());

        AuthEvent event = AuthEvent.builder()
                .userId(data.userId)
                .username(data.username)
                .userRole(data.userRole)
                .agencyId(data.agencyId)
                .agencyName(data.agencyName)
                .eventType(data.success ? "LOGIN" : "LOGIN_FAILED")
                .status(data.success ? "SUCCESS" : "FAILED")
                .failureReason(data.failureReason)
                .eventTimestamp(Instant.now())
                .sessionId(data.sessionId)
                .ipAddress(requestCtx.getIpAddress())
                .userAgent(requestCtx.getUserAgent())
                .deviceType(deviceType)
                .os(os)
                .browser(browser)
                .channel("WEB")
                .applicationName("CrediWise")
                .responseTimeMs(requestCtx.getElapsedMs())
                .requestId(requestCtx.getRequestId())
                .traceId(traceId)
                .isSuspicious(false)
                .build();

        event.persist();
        emitLog(event);

        // Update Prometheus metrics
        String status = data.success ? "success" : "failed";
        if (data.success) {
            metrics.recordLoginSuccess(data.userRole, data.agencyId);
        } else {
            metrics.recordLoginFailed(data.userRole, data.agencyId, data.failureReason);
        }
        metrics.recordLoginDuration(timerSample, status);
    }

    @Transactional
    public void recordLogout(LogoutEventData data) {
        String traceId = currentTraceId();

        AuthEvent event = AuthEvent.builder()
                .userId(data.userId)
                .username(data.username)
                .userRole(data.userRole)
                .agencyId(data.agencyId)
                .agencyName(data.agencyName)
                .eventType("LOGOUT")
                .status("SUCCESS")
                .eventTimestamp(Instant.now())
                .sessionId(data.sessionId)
                .sessionDurationMs(data.sessionDurationMs)
                .ipAddress(requestCtx.getIpAddress())
                .userAgent(requestCtx.getUserAgent())
                .deviceType(detectDeviceType(requestCtx.getUserAgent()))
                .os(detectOs(requestCtx.getUserAgent()))
                .browser(detectBrowser(requestCtx.getUserAgent()))
                .channel("WEB")
                .applicationName("CrediWise")
                .responseTimeMs(requestCtx.getElapsedMs())
                .requestId(requestCtx.getRequestId())
                .traceId(traceId)
                .isSuspicious(false)
                .build();

        event.persist();
        emitLog(event);
        metrics.recordLogout(data.userRole);
    }

    // -------------------------------------------------------------------------
    // Core: MDC-based structured log
    // -------------------------------------------------------------------------

    /**
     * Each MDC.put() call adds an attribute to the OTel LogRecord.
     * Quarkus OTel log bridge (quarkus.otel.logs.enabled=true) promotes
     * MDC entries → OTel attributes → ClickHouse logs_v2 attributes column.
     * This makes every key directly filterable in SigNoz Logs Explorer.
     */
    private void emitLog(AuthEvent e) {
        try {
            // --- user ---
            mdcPut("auth.user_id",    e.getUserId() != null ? e.getUserId().toString() : "anonymous");
            mdcPut("auth.username",   e.getUsername());
            mdcPut("auth.user_role",  e.getUserRole());

            // --- event ---
            mdcPut("auth.event",          e.getEventType());
            mdcPut("auth.status",         e.getStatus());
            mdcPut("auth.failure_reason", e.getFailureReason());

            // --- time ---
            mdcPut("auth.session_id",          e.getSessionId());
            mdcPut("auth.session_duration_ms",  e.getSessionDurationMs());

            // --- network ---
            mdcPut("auth.ip_address",   e.getIpAddress());
            mdcPut("auth.is_suspicious", String.valueOf(Boolean.TRUE.equals(e.getIsSuspicious())));

            // --- device ---
            mdcPut("auth.device_type", e.getDeviceType());
            mdcPut("auth.os",          e.getOs());
            mdcPut("auth.browser",     e.getBrowser());

            // --- business ---
            mdcPut("auth.agency_id",    e.getAgencyId());
            mdcPut("auth.agency_name",  e.getAgencyName());
            mdcPut("auth.application",  e.getApplicationName());
            mdcPut("auth.channel",      e.getChannel());

            // --- technical ---
            mdcPut("auth.response_time_ms", e.getResponseTimeMs());
            mdcPut("auth.request_id",       e.getRequestId());
            mdcPut("auth.trace_id",         e.getTraceId());

            // Human-readable log body (also visible as the log message in SigNoz)
            log.infof("auth_event event=%s status=%s user=%s agency=%s ip=%s device=%s response_ms=%d",
                    e.getEventType(), e.getStatus(), e.getUsername(),
                    e.getAgencyId(), e.getIpAddress(), e.getDeviceType(),
                    e.getResponseTimeMs() != null ? e.getResponseTimeMs() : 0L);

        } finally {
            // Always clean MDC to avoid leaking values into unrelated logs
            MDC.remove("auth.user_id");
            MDC.remove("auth.username");
            MDC.remove("auth.user_role");
            MDC.remove("auth.event");
            MDC.remove("auth.status");
            MDC.remove("auth.failure_reason");
            MDC.remove("auth.session_id");
            MDC.remove("auth.session_duration_ms");
            MDC.remove("auth.ip_address");
            MDC.remove("auth.is_suspicious");
            MDC.remove("auth.device_type");
            MDC.remove("auth.os");
            MDC.remove("auth.browser");
            MDC.remove("auth.agency_id");
            MDC.remove("auth.agency_name");
            MDC.remove("auth.application");
            MDC.remove("auth.channel");
            MDC.remove("auth.response_time_ms");
            MDC.remove("auth.request_id");
            MDC.remove("auth.trace_id");
        }
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private void mdcPut(String key, Object value) {
        if (value != null) {
            MDC.put(key, value.toString());
        }
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
    // Data carriers (called from AuthResource)
    // -------------------------------------------------------------------------

    public static class LoginEventData {
        public UUID   userId;
        public String username;
        public String userRole;
        public String agencyId;
        public String agencyName;
        public boolean success;
        public String failureReason;
        public String sessionId;
    }

    public static class LogoutEventData {
        public UUID   userId;
        public String username;
        public String userRole;
        public String agencyId;
        public String agencyName;
        public String sessionId;
        public Long   sessionDurationMs;
    }
}
