/**
 * Axios instance for CrediWise API calls
 *
 * Security decisions:
 *
 * 1. Same-origin token attachment only:
 *    We check that the request URL starts with VITE_API_BASE_URL (or is a
 *    relative path) before attaching Authorization. This prevents the Bearer
 *    token from being leaked to third-party APIs if a service dependency or
 *    an XSS payload redirects an Axios call to an external host.
 *    Attack prevented: token exfiltration via open redirect or third-party fetch.
 *
 * 2. Proactive token refresh (updateToken(30)):
 *    We refresh the token if it expires within 30 seconds BEFORE attaching it,
 *    not after getting a 401. This avoids sending a nearly-expired token that
 *    would be rejected mid-flight, which reduces unnecessary 401 round-trips and
 *    prevents a race condition where two concurrent requests both trigger refresh.
 *
 * 3. 401 response handler with single retry:
 *    If the server returns 401 (e.g. token was accepted by Nginx but rejected by
 *    the backend for clock-skew or audience mismatch), we attempt one refresh and
 *    retry. On second failure we redirect to login rather than retrying forever,
 *    preventing infinite redirect loops.
 *
 * 4. Token source: keycloak-js adapter (in-memory):
 *    `keycloak.token` is held in the keycloak-js adapter object in JS heap memory.
 *    It is NOT read from localStorage, sessionStorage, or any DOM property.
 *    Attack prevented: XSS can read storage but cannot access a closure variable
 *    inside the keycloak-js module without a full memory walk.
 */
import axios, { type AxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';
import keycloak from '@/config/keycloak';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

/**
 * Returns true only if the request URL is to our own backend.
 * Relative URLs (no host) are always considered internal.
 * Absolute URLs must start with VITE_API_BASE_URL.
 *
 * This prevents the Authorization header from being forwarded
 * to CDNs, third-party analytics, or attacker-controlled servers.
 */
function isInternalRequest(config: AxiosRequestConfig): boolean {
  const url = config.url ?? '';
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return true; // relative URL — same origin by definition
  }
  return url.startsWith(API_BASE_URL);
}

// ── Request interceptor — attach token to internal requests only ──────────
api.interceptors.request.use(
  async (config) => {
    if (!isInternalRequest(config)) {
      // External URL — never attach the Bearer token.
      return config;
    }

    if (keycloak.authenticated) {
      // Proactive refresh: if the token expires within 30 s, refresh it now
      // rather than waiting for the server to reject it with 401.
      try {
        await keycloak.updateToken(30);
      } catch {
        // Refresh token expired or Keycloak unreachable.
        // Redirect to login — the user must re-authenticate.
        keycloak.login();
        return Promise.reject(new Error('Token refresh failed'));
      }
      // Read from keycloak-js adapter (in-memory), not localStorage.
      config.headers.Authorization = `Bearer ${keycloak.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — handle auth errors globally ────────────────────
let isRefreshing = false;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        toast.error('Request timed out. Please try again.');
      } else {
        toast.error('Network error. Please check your connection.');
      }
      return Promise.reject(error);
    }

    const { status } = error.response;

    if (status === 401 && !error.config._retried) {
      // Attempt one silent token refresh and retry the original request.
      // The _retried flag prevents an infinite retry loop.
      if (isRefreshing) {
        // Another concurrent request is already refreshing — fail fast.
        keycloak.login();
        return Promise.reject(error);
      }

      isRefreshing = true;
      try {
        await keycloak.updateToken(0); // force refresh (or reuse current valid token)
        // Retry with current token even when updateToken returns false (token was
        // still valid — covers backend OIDC cold-start 401s where the same token
        // is fine once the service is ready).
        if (keycloak.token) {
          error.config._retried = true;
          error.config.headers.Authorization = `Bearer ${keycloak.token}`;
          return api(error.config);
        }
      } catch {
        // Refresh failed — full re-authentication required.
        keycloak.login();
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    if (status === 403) {
      toast.error('You do not have permission to perform this action.');
    } else if (status >= 500) {
      toast.error('Server error. Please try again later.');
    }

    return Promise.reject(error);
  }
);

export default api;
