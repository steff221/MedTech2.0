# syntax=docker/dockerfile:1.6
# ============================================================================
# MedTech 2.0 — Frontend (Next.js 14) container
# ----------------------------------------------------------------------------
# Multi-stage build: deps → build → runtime.
# Uses Next.js "standalone" output mode so the final image only ships the
# minimal Node server (no source, no devDependencies).
# ============================================================================

# ---- 1. deps stage: install node_modules once, cached layer ----------------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-fund --no-audit

# ---- 2. build stage: compile Next.js production output ---------------------
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Guarantee public/ exists even if the directory was empty in the repo
RUN mkdir -p ./public

# NEXT_PUBLIC_* vars are baked into the bundle at build time — the value
# matters here, not at runtime.
ARG NEXT_PUBLIC_API_URL=http://localhost:8080/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ---- 3. runtime stage: minimal Node server ---------------------------------
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Standalone build output: server.js + the chunked node_modules it needs
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
# Static assets and public/ are served separately at runtime
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD wget -qO- http://localhost:3000/login >/dev/null 2>&1 || exit 1

CMD ["node", "server.js"]
