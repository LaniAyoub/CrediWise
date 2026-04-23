CREATE TABLE IF NOT EXISTS auth_events (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             UUID,
    username            VARCHAR(255),
    user_role           VARCHAR(50),
    agency_id           VARCHAR(10),
    agency_name         VARCHAR(100),
    event_type          VARCHAR(30)  NOT NULL,
    status              VARCHAR(20)  NOT NULL,
    failure_reason      VARCHAR(255),
    event_timestamp     TIMESTAMPTZ  NOT NULL,
    session_id          VARCHAR(64),
    session_duration_ms BIGINT,
    ip_address          VARCHAR(45),
    user_agent          VARCHAR(512),
    device_type         VARCHAR(20),
    os                  VARCHAR(50),
    browser             VARCHAR(50),
    channel             VARCHAR(20),
    application_name    VARCHAR(50),
    response_time_ms    BIGINT,
    request_id          VARCHAR(64),
    trace_id            VARCHAR(64),
    error_code          VARCHAR(20),
    is_suspicious       BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_auth_event_user_id   ON auth_events (user_id);
CREATE INDEX IF NOT EXISTS idx_auth_event_timestamp ON auth_events (event_timestamp);
CREATE INDEX IF NOT EXISTS idx_auth_event_type      ON auth_events (event_type);
