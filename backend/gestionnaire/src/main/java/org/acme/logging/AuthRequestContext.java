package org.acme.logging;

import jakarta.enterprise.context.RequestScoped;

/**
 * Holds per-request metadata populated by AuthRequestFilter.
 * Injected into AuthEventService to avoid passing these values manually.
 */
@RequestScoped
public class AuthRequestContext {

    private String ipAddress;
    private String userAgent;
    private String requestId;
    private long requestStartMs = System.currentTimeMillis();

    public String getIpAddress()  { return ipAddress; }
    public String getUserAgent()  { return userAgent; }
    public String getRequestId()  { return requestId; }
    public long   getElapsedMs()  { return System.currentTimeMillis() - requestStartMs; }

    public void setIpAddress(String v)  { this.ipAddress = v; }
    public void setUserAgent(String v)  { this.userAgent = v; }
    public void setRequestId(String v)  { this.requestId = v; }
}
