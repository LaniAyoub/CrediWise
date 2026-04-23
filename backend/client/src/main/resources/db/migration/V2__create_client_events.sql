-- Audit table for client business events (OTel observability)
CREATE TABLE IF NOT EXISTS client_events (
    id                BIGSERIAL PRIMARY KEY,
    event_type        VARCHAR(50)  NOT NULL,
    status            VARCHAR(20)  NOT NULL,
    client_id         UUID,
    client_type       VARCHAR(20),
    client_status     VARCHAR(20),
    national_id       VARCHAR(50),
    email             VARCHAR(255),
    segment           VARCHAR(100),
    risk_level        VARCHAR(20),
    agence_id         VARCHAR(50),
    manager_id        UUID,
    actor_id          UUID,
    failure_reason    TEXT,
    ip_address        VARCHAR(60),
    device_type       VARCHAR(20),
    os                VARCHAR(30),
    browser           VARCHAR(30),
    response_time_ms  BIGINT,
    request_id        VARCHAR(50),
    trace_id          VARCHAR(64),
    event_timestamp   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_events_client_id   ON client_events (client_id);
CREATE INDEX IF NOT EXISTS idx_client_events_event_type  ON client_events (event_type);
CREATE INDEX IF NOT EXISTS idx_client_events_timestamp   ON client_events (event_timestamp DESC);
CREATE SEQUENCE IF NOT EXISTS client_events_SEQ START WITH 1 INCREMENT BY 50;
