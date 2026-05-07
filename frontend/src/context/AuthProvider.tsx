/**
 * AuthProvider — Keycloak OIDC integration
 *
 * Token storage: React state (memory) only.
 *   WHY NOT localStorage/sessionStorage: Any JavaScript executing on the page
 *   (including XSS payloads, malicious browser extensions, or compromised
 *   third-party scripts) can read storage synchronously. An in-memory token
 *   survives only while the React tree is mounted, limiting exfiltration
 *   opportunities. Tokens are never written to disk or any persistent store.
 *
 * Token survival across reloads:
 *   Keycloak sets an HttpOnly, SameSite=Lax session cookie on its own domain
 *   during login. On page reload, the silentCheckSso iframe makes a background
 *   request to Keycloak; if the session cookie is still valid, Keycloak issues
 *   a fresh access token — no redirect, no localStorage needed.
 *
 * PKCE (S256):
 *   Proof Key for Code Exchange prevents authorization code interception attacks.
 *   Without PKCE, an attacker who intercepts the ?code= in a redirect URL (e.g.
 *   via browser history, referrer header, or open redirector) can exchange it for
 *   tokens. PKCE binds the code to a verifier known only to the initiating tab.
 */
import { useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import type { User } from '@/types/auth.types';
import { AuthContext, extractUser } from './auth';
import keycloak from '@/config/keycloak';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Read and immediately clear the logout flag so it never persists across
    // multiple page loads (prevents an infinite logout loop).
    const logoutRequested = sessionStorage.getItem('logout_requested') === '1';
    if (logoutRequested) sessionStorage.removeItem('logout_requested');

    keycloak
      .init({
        /**
         * Post-logout: use 'check-sso' so we can detect whether the Keycloak
         * session was truly invalidated.  If the session somehow survived we
         * force a second logout below.  For normal (non-logout) page loads we
         * keep 'login-required' so unauthenticated users are redirected to the
         * Keycloak login page automatically.
         */
        onLoad: logoutRequested ? 'check-sso' : 'login-required',

        /**
         * silentCheckSsoRedirectUri:
         * Instead of disabling the iframe check entirely (checkLoginIframe: false),
         * we point it at a minimal static page that calls keycloak.checkLoginIframe().
         * This allows Keycloak to detect session expiry or logout in another tab
         * WITHOUT a full page redirect — the iframe runs silently in the background.
         *
         * The file public/silent-check-sso.html must be served by the same origin as
         * the React app. It contains only the Keycloak adapter postMessage handshake.
         *
         * Security: the iframe is sandboxed to the same origin; it cannot access the
         * parent page's DOM or memory token.
         */
        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',

        /**
         * PKCE S256: prevents authorization code interception.
         * The code verifier is generated per-request and stored only in sessionStorage
         * by the keycloak-js adapter (never in localStorage, never sent to any server
         * other than Keycloak).
         */
        pkceMethod: 'S256',
      })
      .then((authenticated) => {
        if (authenticated && keycloak.token && keycloak.tokenParsed) {
          if (logoutRequested) {
            // The Keycloak SSO session survived the logout call.  Force a
            // second logout; set the flag again so the next page load still
            // uses check-sso and repeats this guard.
            sessionStorage.setItem('logout_requested', '1');
            keycloak.logout({ redirectUri: window.location.origin + '/' });
            return;
          }
          setToken(keycloak.token);
          setUser(extractUser(keycloak.tokenParsed, keycloak.idTokenParsed ?? undefined));
        } else if (!authenticated && logoutRequested) {
          // Session was properly invalidated.  Redirect to the Keycloak login
          // page so the user can sign back in with a clean session.
          keycloak.login();
          return;
        }
        setIsLoading(false);
      })
      .catch((err) => {
        // Log the error but never expose Keycloak internals to the user.
        // A misconfigured Keycloak URL should not reveal the server address.
        console.error('Keycloak init failed');
        if (import.meta.env.DEV) console.error(err);
        // If init failed mid-logout, clear the flag and let the user see the
        // app in an unauthenticated state so they can retry manually.
        if (logoutRequested) sessionStorage.removeItem('logout_requested');
        setIsLoading(false);
      });

    /**
     * onTokenExpired fires ~30 s before the access token's exp claim.
     * updateToken(30) attempts a silent refresh via the refresh token.
     * If the refresh token is also expired (absolute session timeout reached),
     * keycloak.login() redirects to Keycloak — the user re-authenticates and
     * returns to the same URL via state parameter.
     *
     * We always update in-memory state after a successful refresh so that
     * the new token (with potentially updated roles) propagates to all
     * downstream consumers immediately.
     */
    keycloak.onTokenExpired = () => {
      keycloak
        .updateToken(30)
        .then((refreshed) => {
          if (refreshed && keycloak.token && keycloak.tokenParsed) {
            setToken(keycloak.token);
            setUser(extractUser(keycloak.tokenParsed, keycloak.idTokenParsed ?? undefined));
          }
        })
        .catch(() => {
          // Refresh token expired — full re-authentication required.
          // Clear in-memory state before redirect so no stale token lingers.
          setToken(null);
          setUser(null);
          keycloak.logout({ redirectUri: window.location.origin + '/' });
        });
    };
  }, []);

  const login = useCallback(() => {
    keycloak.login();
  }, []);

  /**
   * Secure logout:
   *   1. Clear in-memory token immediately (no window to steal it after the call).
   *   2. Strip any token-related query params from the current URL before
   *      passing redirectUri — prevents leaking a stale ?code= or ?session_state=
   *      into the post-logout landing page URL (which could appear in server logs).
   *   3. keycloak.logout() invalidates the Keycloak session cookie server-side,
   *      which also terminates the silent SSO iframe session.
   */
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);

    // Mark that a logout was explicitly requested.  On the next page load the
    // init logic reads this flag and uses 'check-sso' instead of
    // 'login-required', so it can detect whether the Keycloak session was
    // truly invalidated (and force another logout if it wasn't).
    sessionStorage.setItem('logout_requested', '1');

    // post_logout_redirect_uri must match "Valid Post Logout Redirect URIs" configured
    // on the crediwise-frontend client in Keycloak (currently: http://localhost:3000/*).
    keycloak.logout({ redirectUri: window.location.origin + '/' }).catch(() => {
      sessionStorage.removeItem('logout_requested');
      window.location.href = window.location.origin + '/';
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
