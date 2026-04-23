package org.acme.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "auth_events", indexes = {
        @Index(name = "idx_auth_event_user_id", columnList = "user_id"),
        @Index(name = "idx_auth_event_timestamp", columnList = "event_timestamp"),
        @Index(name = "idx_auth_event_type", columnList = "event_type")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthEvent extends PanacheEntity {

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "username", length = 255)
    private String username;

    @Column(name = "user_role", length = 50)
    private String userRole;

    @Column(name = "agency_id", length = 10)
    private String agencyId;

    @Column(name = "agency_name", length = 100)
    private String agencyName;

    @Column(name = "event_type", nullable = false, length = 30)
    private String eventType;   // LOGIN, LOGOUT, LOGIN_FAILED

    @Column(name = "status", nullable = false, length = 20)
    private String status;      // SUCCESS, FAILED

    @Column(name = "failure_reason", length = 255)
    private String failureReason;

    @Column(name = "event_timestamp", nullable = false)
    private Instant eventTimestamp;

    @Column(name = "session_id", length = 64)
    private String sessionId;

    @Column(name = "session_duration_ms")
    private Long sessionDurationMs;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 512)
    private String userAgent;

    @Column(name = "device_type", length = 20)
    private String deviceType;  // MOBILE, DESKTOP, TABLET

    @Column(name = "os", length = 50)
    private String os;

    @Column(name = "browser", length = 50)
    private String browser;

    @Column(name = "channel", length = 20)
    private String channel;     // WEB, MOBILE_APP

    @Column(name = "application_name", length = 50)
    private String applicationName;

    @Column(name = "response_time_ms")
    private Long responseTimeMs;

    @Column(name = "request_id", length = 64)
    private String requestId;

    @Column(name = "trace_id", length = 64)
    private String traceId;

    @Column(name = "error_code", length = 20)
    private String errorCode;

    @Column(name = "is_suspicious")
    private Boolean isSuspicious;
}
