# Multi-stage Dockerfile for EAOS services
# Build: docker build --build-arg SERVICE=gateway -t eaos-gateway .

# --- Stage 1: Base ---
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# --- Stage 2: Dependencies ---
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/ packages/
COPY services/ services/
COPY connectors/ connectors/
RUN pnpm install --frozen-lockfile --prod=false

# --- Stage 3: Build ---
FROM deps AS build
ARG SERVICE
RUN pnpm --filter "@agentos/*" build
RUN pnpm --filter "@agentos/${SERVICE}" build

# --- Stage 4: Production Runtime ---
FROM node:20-alpine AS runtime
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

ARG SERVICE
ENV NODE_ENV=production
ENV SERVICE_NAME=${SERVICE}

# Copy built output
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/services ./services
COPY --from=build /app/package.json ./

# Non-root user
RUN addgroup -g 1001 eaos && adduser -u 1001 -G eaos -s /bin/sh -D eaos
USER eaos

EXPOSE 3000 3001 3002 3004 3005 3006 3007

# Use shell form so SERVICE env var is expanded at runtime.
# Gateway compiles to dist/server.js; other services fall back to dist/index.js.
CMD if [ -f services/${SERVICE_NAME}/dist/server.js ]; then \
      node services/${SERVICE_NAME}/dist/server.js; \
    else \
      node services/${SERVICE_NAME}/dist/index.js; \
    fi
