package org.acme.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.Map;

@Getter
@Builder
public class ApiErrorResponse {
    public Instant timestamp;
    public int status;
    public String error;
    public String message;
    public Map<String, String> details;
}
