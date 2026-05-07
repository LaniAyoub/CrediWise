#!/bin/sh
# ============================================================
# CrediWise – Nginx entrypoint
# ============================================================
# Substitutes environment variables into all .conf.template
# files before starting Nginx.
#
# Required environment variables:
#   NGINX_SERVER_NAME      — server_name directive (e.g. app.crediwise.com)
#   CORS_ALLOWED_ORIGINS   — single allowed origin (e.g. https://app.crediwise.com)
#   KEYCLOAK_PUBLIC_URL    — public Keycloak URL for CSP connect-src/form-action
# ============================================================
set -e

# Validate required variables
: "${NGINX_SERVER_NAME:?NGINX_SERVER_NAME env var is required}"
: "${CORS_ALLOWED_ORIGINS:?CORS_ALLOWED_ORIGINS env var is required}"
: "${KEYCLOAK_PUBLIC_URL:?KEYCLOAK_PUBLIC_URL env var is required}"

# --- Provide safe defaults for upstream services so templates work without
# requiring users to set every single env var in development.
: "${GESTIONNAIRE_HOST:=gestionnaire}"
: "${GESTIONNAIRE_PORT:=8080}"
: "${CLIENT_HOST:=client}"
: "${CLIENT_PORT:=8082}"
: "${NOUVELLE_DEMANDE_HOST:=nouvelle_demande}"
: "${NOUVELLE_DEMANDE_PORT:=8083}"
: "${ANALYSE_HOST:=analyse}"
: "${ANALYSE_PORT:=8084}"
: "${KEYCLOAK_HOST:=keycloak}"
: "${KEYCLOAK_PORT:=8080}"

# Create TLS certs if they are missing (development convenience only).
# In production, mount real certificates into /etc/nginx/ssl and disable this.
if [ ! -f /etc/nginx/ssl/fullchain.pem ] || [ ! -f /etc/nginx/ssl/privkey.pem ]; then
    echo "[entrypoint] TLS certificates not found — generating self-signed cert for development"
    mkdir -p /etc/nginx/ssl
    # CN should match NGINX_SERVER_NAME so browsers will accept cert for testing
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/privkey.pem \
        -out /etc/nginx/ssl/fullchain.pem \
        -subj "/CN=${NGINX_SERVER_NAME}"
    chmod 600 /etc/nginx/ssl/privkey.pem
fi

if [ ! -f /etc/nginx/ssl/dhparam.pem ]; then
    echo "[entrypoint] Generating dhparam (2048 bits) — this may take a few seconds"
    openssl dhparam -out /etc/nginx/ssl/dhparam.pem 2048
fi

echo "[entrypoint] Resolved upstreams:"
echo "  gestionnaire -> ${GESTIONNAIRE_HOST}:${GESTIONNAIRE_PORT}"
echo "  client       -> ${CLIENT_HOST}:${CLIENT_PORT}"
echo "  nouvelle_demande -> ${NOUVELLE_DEMANDE_HOST}:${NOUVELLE_DEMANDE_PORT}"
echo "  analyse      -> ${ANALYSE_HOST}:${ANALYSE_PORT}"
echo "  keycloak     -> ${KEYCLOAK_HOST}:${KEYCLOAK_PORT}"

echo "[entrypoint] Substituting environment variables into Nginx config..."

# List of variables to substitute — be explicit to avoid replacing
# unintended dollar signs in the config files.
VARS='$NGINX_SERVER_NAME $CORS_ALLOWED_ORIGINS $KEYCLOAK_PUBLIC_URL $GESTIONNAIRE_HOST $GESTIONNAIRE_PORT $CLIENT_HOST $CLIENT_PORT $NOUVELLE_DEMANDE_HOST $NOUVELLE_DEMANDE_PORT $ANALYSE_HOST $ANALYSE_PORT $KEYCLOAK_HOST $KEYCLOAK_PORT'

envsubst "$VARS" < /etc/nginx/nginx.conf.template \
    > /etc/nginx/nginx.conf

for template in /etc/nginx/conf.d/*.template; do
    dest="${template%.template}"
    envsubst "$VARS" < "$template" > "$dest"
    echo "[entrypoint] Generated: $dest"
done

echo "[entrypoint] Testing Nginx configuration..."
nginx -t

echo "[entrypoint] Starting Nginx..."
exec nginx -g "daemon off;"
