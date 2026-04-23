package org.acme.logging;

import jakarta.enterprise.context.RequestScoped;

@RequestScoped
public class DemandeRequestContext {

    private String ipAddress  = "unknown";
    private String userAgent  = "unknown";
    private String requestId  = "unknown";
    private final long requestStartMs = System.currentTimeMillis();

    public long getElapsedMs() { return System.currentTimeMillis() - requestStartMs; }

    public String getIpAddress() { return ipAddress; }
    public String getUserAgent() { return userAgent; }
    public String getRequestId() { return requestId; }

    public void setIpAddress(String v) { this.ipAddress = v != null ? v : "unknown"; }
    public void setUserAgent(String v) { this.userAgent = v != null ? v : "unknown"; }
    public void setRequestId(String v) { this.requestId = v != null ? v : "unknown"; }
}
