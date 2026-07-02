# Custom nginx image — the config is COPIED into the image rather than
# bind-mounted as a single file.
#
# Why: Docker Desktop on macOS (virtiofs / gRPC-FUSE) returns EDEADLK
# ("35: Resource deadlock would occur") when nginx reads an individually
# bind-mounted file. That crashes nginx on startup; with restart: unless-stopped
# the container then restart-loops forever. Baking the config in avoids the
# single-file mount entirely.
#
# Select the config at build time:
#   dev  (default): conf.d/medtech-dev.conf  — plain HTTP on :80
#   prod          : conf.d/medtech.conf      — TLS termination on :443
FROM nginx:1.27-alpine

ARG NGINX_CONF=conf.d/medtech-dev.conf
COPY ${NGINX_CONF} /etc/nginx/conf.d/default.conf
