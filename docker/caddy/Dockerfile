FROM caddy:2.8-alpine

# Note: Caddyfile is mounted at runtime via docker-compose volumes
# This allows switching between different Caddyfiles without rebuilding

# Expose HTTPS and HTTP ports
EXPOSE 443
EXPOSE 80

# Caddy runs as non-root by default
# Data directory for certificates and state
VOLUME /data
VOLUME /certs
