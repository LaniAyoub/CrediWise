-- Audit table for demande business events (OTel observability)
CREATE TABLE IF NOT EXISTS demande_events (
    id                    BIGSERIAL PRIMARY KEY,
    event_type            VARCHAR(50)    NOT NULL,
    status                VARCHAR(20)    NOT NULL,
    demande_id            BIGINT,
    client_id             UUID,
    client_type           VARCHAR(20),
    previous_status       VARCHAR(20),
    new_status            VARCHAR(20),
    product_id            VARCHAR(50),
    requested_amount      NUMERIC(15,2),
    duration_months       INT,
    cycle                 VARCHAR(20),
    branch_id             VARCHAR(50),
    branch_name           VARCHAR(255),
    manager_name          VARCHAR(255),
    failure_reason        TEXT,
    ip_address            VARCHAR(60),
    device_type           VARCHAR(20),
    os                    VARCHAR(30),
    browser               VARCHAR(30),
    response_time_ms      BIGINT,
    request_id            VARCHAR(50),
    trace_id              VARCHAR(64),
    event_timestamp       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_demande_events_demande_id    ON demande_events (demande_id);
CREATE INDEX IF NOT EXISTS idx_demande_events_client_id     ON demande_events (client_id);
CREATE INDEX IF NOT EXISTS idx_demande_events_event_type    ON demande_events (event_type);
CREATE INDEX IF NOT EXISTS idx_demande_events_timestamp     ON demande_events (event_timestamp DESC);
CREATE SEQUENCE IF NOT EXISTS demande_events_SEQ START WITH 1 INCREMENT BY 50;
