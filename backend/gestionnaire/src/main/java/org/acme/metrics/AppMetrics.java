package org.acme.metrics;

import io.micrometer.core.instrument.*;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.concurrent.atomic.AtomicInteger;

/**
 * Central registry for all business metrics.
 *
 * Exposed at GET /q/metrics (Prometheus format).
 * Each metric is visible in SigNoz → Metrics or any Prometheus-compatible dashboard.
 *
 * Metrics defined here:
 *
 *  auth_login_total{status, role, agency_id}      — login attempts
 *  auth_logout_total{role}                        — logout events
 *  auth_login_failed_total{reason}                — failed login breakdown
 *  auth_login_duration_ms{status}                 — login latency histogram
 *  auth_active_sessions                           — live gauge (inc on login, dec on logout)
 *  http_api_requests_total{method, path, status}  — all API calls (auto via Micrometer)
 */
@ApplicationScoped
public class AppMetrics {

    private final MeterRegistry registry;

    // Tracks in-flight sessions — backed by an AtomicInteger so it's thread-safe
    private final AtomicInteger activeSessions = new AtomicInteger(0);

    @Inject
    public AppMetrics(MeterRegistry registry) {
        this.registry = registry;

        // Register the gauge once at startup
        Gauge.builder("auth.active_sessions", activeSessions, AtomicInteger::get)
                .description("Number of currently active sessions")
                .register(registry);
    }

    // ------------------------------------------------------------------
    // Auth events
    // ------------------------------------------------------------------

    public void recordLoginSuccess(String role, String agencyId) {
        loginCounter("success", role, agencyId).increment();
        activeSessions.incrementAndGet();
    }

    public void recordLoginFailed(String role, String agencyId, String reason) {
        loginCounter("failed", role, agencyId).increment();

        Counter.builder("auth.login_failed_total")
                .description("Failed login attempts by reason")
                .tag("reason", reason != null ? reason : "unknown")
                .register(registry)
                .increment();
    }

    public void recordLogout(String role) {
        Counter.builder("auth.logout_total")
                .description("Logout events")
                .tag("role", role != null ? role : "unknown")
                .register(registry)
                .increment();

        // Decrement but never go below 0
        activeSessions.updateAndGet(v -> Math.max(0, v - 1));
    }

    /**
     * Call this with a Timer.Sample started before the login logic:
     *
     *   Timer.Sample sample = Timer.start(registry);
     *   // ... login logic ...
     *   metrics.recordLoginDuration(sample, "success");
     */
    public void recordLoginDuration(Timer.Sample sample, String status) {
        sample.stop(Timer.builder("auth.login_duration_ms")
                .description("Login endpoint latency")
                .tag("status", status)
                .publishPercentiles(0.5, 0.95, 0.99)
                .register(registry));
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private Counter loginCounter(String status, String role, String agencyId) {
        return Counter.builder("auth.login_total")
                .description("Total login attempts")
                .tag("status",    status)
                .tag("role",      role      != null ? role      : "unknown")
                .tag("agency_id", agencyId  != null ? agencyId  : "none")
                .register(registry);
    }
}
