# Self-Hosting Approach for Zeta Prompt Library

## Overview

This document explains how zeta-prompt-library self-hosts prompts.chat following the recommended best practices for Kubernetes deployment.

## Two Self-Hosting Patterns

prompt.chat supports two self-hosting approaches:

### Pattern A: Build-Time Configuration (✅ **Used by zeta-prompt-library**)

**How it works:**

1. Clone prompts.chat source code during Docker build
2. Generate `prompts.config.ts` from build arguments
3. Build Next.js application with baked-in configuration
4. Result: Fast-starting, immutable container image

**Pros:**

- ✅ Fast container startup (seconds, not minutes)
- ✅ Immutable infrastructure - config is version-controlled with image
- ✅ Perfect for Kubernetes - no shared volumes needed
- ✅ Easy to rollback - deploy previous image version
- ✅ Multi-instance ready - all pods identical

**Cons:**

- ❌ Need to rebuild image to change branding/features
- ❌ Requires CI/CD pipeline for configuration changes

**Best for:** Production Kubernetes deployments (like Zeta)

### Pattern B: Runtime Configuration (❌ Not used by zeta-prompt-library)

**How it works:**

1. Use `ghcr.io/f/prompts.chat` image (contains bootstrap script)
2. Container clones repo and builds on first startup
3. Configuration from runtime environment variables
4. Build artifacts persist to volume

**Pros:**

- ✅ Easy local testing - just `docker run`
- ✅ Change config without rebuilding image
- ✅ No CI/CD needed

**Cons:**

- ❌ Slow first startup (2-3 minutes)
- ❌ Requires persistent volume for build artifacts
- ❌ Not suitable for horizontal scaling
- ❌ Drift between instances if volumes differ

**Best for:** Quick local testing, single-instance deployments

## Our Implementation (Pattern A)

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Build Stage (Dockerfile builder)                             │
├─────────────────────────────────────────────────────────────┤
│ 1. Clone prompts.chat source                                 │
│ 2. Install dependencies                                      │
│ 3. Generate prompts.config.ts from build args                │
│    └─> node scripts/docker-setup.js                          │
│        ├─> BRAND_NAME → branding.name                        │
│        ├─> BRAND_COLOR → theme.colors.primary                │
│        ├─> AUTH_PROVIDERS → auth.providers                   │
│        └─> FEATURE_* → features.*                            │
│ 4. Build Next.js app (standalone mode)                       │
│ 5. Generate Prisma client                                    │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ Runtime Stage (Dockerfile runtime)                           │
├─────────────────────────────────────────────────────────────┤
│ 1. Copy built app from builder stage                         │
│ 2. Copy Prisma schema + migrations                           │
│ 3. Install prisma CLI (for migrate deploy)                   │
│ 4. Set runtime env vars (NODE_ENV, PORT)                     │
│ 5. Run start.sh on container start                           │
│    └─> npx prisma migrate deploy                             │
│    └─> node server.js                                        │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ Kubernetes Deployment                                         │
├─────────────────────────────────────────────────────────────┤
│ ConfigMap (envProperties in values.yaml):                    │
│   - TZ=UTC                                                    │
│                                                               │
│ Secrets (Vault-injected):                                    │
│   - DATABASE_URL                                              │
│   - AUTH_SECRET                                               │
│   - AUTH_GITHUB_ID                                            │
│   - AUTH_GITHUB_SECRET                                        │
│                                                               │
│ Branding/Features (baked into image):                        │
│   ✅ prompts.config.ts generated at build-time                │
│   ✅ No runtime env var overrides needed                      │
│   ✅ Immutable configuration per image version                │
└─────────────────────────────────────────────────────────────┘
```

### Build-Time vs Runtime Configuration

| Configuration | Set At | Method | Can Change At Runtime? |
|---------------|--------|--------|------------------------|
| **Branding** (name, logo, colors) | Build-time | Dockerfile ARG → docker-setup.js | ❌ No - requires image rebuild |
| **Features** (privatePrompts, etc) | Build-time | Dockerfile ARG → docker-setup.js | ❌ No - requires image rebuild |
| **Theme** (radius, variant) | Build-time | Dockerfile ARG → docker-setup.js | ❌ No - requires image rebuild |
| **Auth providers** (github, google) | Build-time | Dockerfile ARG → docker-setup.js | ❌ No - requires image rebuild |
| **Database URL** | Runtime | Kubernetes Secret/ConfigMap | ✅ Yes - rolling update |
| **Auth credentials** | Runtime | Kubernetes Secret (Vault) | ✅ Yes - rolling update |
| **OpenAI API key** | Runtime | Kubernetes Secret (optional) | ✅ Yes - rolling update |

### Environment Variable Naming

**⚠️ IMPORTANT:** Use the correct environment variable names for each stage:

#### Build-Time (Dockerfile ARG)

```dockerfile
ARG BRAND_NAME="Zeta Prompt Library"          # ✅ Correct for docker-setup.js
ARG BRAND_COLOR="#6366f1"                      # ✅ Correct
ARG AUTH_PROVIDERS="github"                    # ✅ Correct
ARG FEATURE_PRIVATE_PROMPTS="true"             # ✅ Correct
```

**❌ DON'T USE:**

```dockerfile
ARG PCHAT_NAME="..."        # ❌ Wrong - docker-setup.js won't read this
ARG PCHAT_COLOR="..."       # ❌ Wrong
```

#### Runtime (Kubernetes ConfigMap/Secret)

```yaml
env:
  - name: DATABASE_URL                   # ✅ Standard NextAuth.js / Prisma
    value: postgresql://...
  - name: AUTH_SECRET                    # ✅ Standard NextAuth.js
    value: ...
  - name: AUTH_GITHUB_ID                 # ✅ Standard NextAuth.js
    value: ...
```

**❌ DON'T USE:**

```yaml
# These were removed - config is baked into image!
env:
  - name: PCHAT_NAME                     # ❌ Wrong - ignored at runtime
    value: "Zeta Prompt Library"
  - name: PCHAT_FEATURE_PRIVATE_PROMPTS  # ❌ Wrong - ignored at runtime
    value: "true"
```

### Customization Workflow

#### Option 1: Change Branding/Features (Requires Rebuild)

```bash
# 1. Edit Dockerfile ARG values
vim Dockerfile
# Change: ARG BRAND_NAME="Zeta Prompt Library"
# To:     ARG BRAND_NAME="StarLabs Prompt Library"

# 2. Rebuild image
make build

# 3. Deploy to K8s
make helm-upgrade
```

#### Option 2: Change Runtime Config (No Rebuild)

```bash
# 1. Edit helm values
vim helm-chart/values.yaml
# Change: DATABASE_URL vault secret reference
# Or add: OPENAI_API_KEY for AI features

# 2. Deploy changes
make helm-upgrade
# Triggers rolling update with new env vars
```

## Comparison with prompt.chat Official Docker Image

| Aspect | `ghcr.io/f/prompts.chat` | `zeta-prompt-library` |
|--------|--------------------------|------------------------|
| **Configuration** | Runtime (env vars at startup) | Build-time (baked into image) |
| **Startup time** | 2-3 minutes (first run) | 10-15 seconds |
| **PostgreSQL** | Included (embedded) | External (K8s service) |
| **Persistence** | Requires volume mount | Stateless (DB only) |
| **Scaling** | Single instance only | Horizontal scaling ready |
| **K8s compatibility** | Poor (needs volumes) | Excellent (stateless) |
| **Customization** | Easy (env vars) | Requires rebuild |
| **Best for** | Quick local testing | Production K8s deployment |

## Best Practices for Kubernetes

### ✅ DO

1. **Bake configuration into image** - Immutable infrastructure
2. **Use external PostgreSQL** - Managed service or StatefulSet
3. **Store secrets in Vault** - Not in ConfigMaps
4. **Run migrations at startup** - `prisma migrate deploy` in entrypoint
5. **Use health checks** - `/api/health` endpoint
6. **Set resource limits** - Prevent OOM kills
7. **Use rolling updates** - Zero-downtime deployments
8. **Tag images properly** - Semantic versioning

### ❌ DON'T

1. **Don't use runtime config generation** - Slow startup, inconsistent state
2. **Don't embed PostgreSQL** - Not cloud-native
3. **Don't use latest tag** - Use specific versions
4. **Don't skip migrations** - Will cause runtime errors
5. **Don't hardcode secrets** - Use Vault/sealed secrets
6. **Don't run as root** - Use node user (uid 1000)

## Migration Guide

If you were using runtime configuration (PCHAT_* env vars):

### Before (Runtime Config - ❌ Wrong)

```yaml
# values.yaml
envProperties:
  PCHAT_NAME: "Zeta Prompt Library"
  PCHAT_COLOR: "#6366f1"
  PCHAT_FEATURE_PRIVATE_PROMPTS: "true"
```

### After (Build-Time Config - ✅ Correct)

```dockerfile
# Dockerfile
ARG BRAND_NAME="Zeta Prompt Library"
ARG BRAND_COLOR="#6366f1"
ARG FEATURE_PRIVATE_PROMPTS="true"

RUN BRAND_NAME="${BRAND_NAME}" \
    BRAND_COLOR="${BRAND_COLOR}" \
    FEATURE_PRIVATE_PROMPTS="${FEATURE_PRIVATE_PROMPTS}" \
    node scripts/docker-setup.js
```

```yaml
# values.yaml (only runtime config remains)
envProperties:
  TZ: UTC
  DATABASE_URL: vault:secrets/...
  AUTH_SECRET: vault:secrets/...
```

## Troubleshooting

### Image builds but config is wrong

**Cause:** Using wrong env var names (PCHAT_*instead of BRAND_*, etc)

**Fix:**

```bash
# Check what docker-setup.js expects:
cat prompt.chat/scripts/docker-setup.js | grep "env("

# Use: BRAND_NAME, BRAND_COLOR, AUTH_PROVIDERS, FEATURE_*
# Not: PCHAT_NAME, PCHAT_COLOR, PCHAT_AUTH_PROVIDERS, PCHAT_FEATURE_*
```

### Container crashes: "Cannot find module"

**Cause:** Prisma client not generated during build

**Fix:**

```dockerfile
# Ensure this runs in builder stage:
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" \
    npx prisma generate
```

### Database migrations fail

**Cause:** DATABASE_URL not set or incorrect

**Fix:**

```bash
# Check secret is properly injected
kubectl get secret zeta-prompt-library-env -o yaml

# Check pod env vars
kubectl exec -it <pod> -- env | grep DATABASE_URL
```

### Config changes not applied

**Cause:** Config is baked into image, forgot to rebuild

**Fix:**

```bash
# Rebuild image after changing Dockerfile ARGs
make build

# Push to registry
docker tag zeta-prompt-library:latest registry/zeta-prompt-library:v1.2.0
docker push registry/zeta-prompt-library:v1.2.0

# Update helm values
vim helm-chart/values.yaml
# Change: tag: "v1.2.0"

# Deploy
make helm-upgrade
```

## References

- [prompts.chat Self-Hosting Guide](../prompt.chat/SELF-HOSTING.md)
- [prompts.chat Docker Setup Script](../prompt.chat/scripts/docker-setup.js)
- [Next.js Standalone Mode](https://nextjs.org/docs/pages/api-reference/next-config-js/output#automatically-copying-traced-files)
- [Prisma Migrate Deploy](https://www.prisma.io/docs/orm/reference/prisma-cli-reference#migrate-deploy)
