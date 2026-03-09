# Issues & Decisions Log

## Issue #1: Kubernetes Deployment Incompatibility with Base Image

**Status:** In Progress  
**Date Identified:** 2026-02-01  
**Severity:** High  
**Component:** Docker Image, Kubernetes Deployment

### Core Issue

The upstream `ghcr.io/f/prompts.chat:latest` base image is architecturally incompatible with Kubernetes deployment patterns:

#### 1. **Embedded PostgreSQL**

- The image runs PostgreSQL **inside the same container** as the Next.js application
- Violates Kubernetes best practice: one process per container
- Makes horizontal scaling impossible (each pod would have its own database)
- Conflicts with Kubernetes security contexts

#### 2. **Runtime Build Process**

- Container clones source repository at startup: `git clone https://github.com/f/prompts.chat /data/app`
- Installs 1249+ npm packages at runtime
- Builds Next.js application (2-3 minute process)
- Requires write access to `/data/app` directory

#### 3. **User Permission Conflicts**

- Startup script uses `su postgres` to initialize PostgreSQL
- Kubernetes security context enforces `runAsUser: 1000` and `runAsNonRoot: true`
- Results in: `su: Authentication failure`

### Error Sequence

```
Container starts
  → bootstrap.sh executes
  → Attempts: su postgres -c "initdb -D /data/postgres"
  → ❌ FAIL: Authentication failure
  
Alternative path:
  → Relax security context (runAsNonRoot: false)
  → PostgreSQL initializes successfully
  → Attempts: git clone to /data/app
  → ❌ FAIL: Permission denied (filesystem read-only)
```

### Impact

- **Blocking:** Cannot deploy to Kubernetes
- **Performance:** 2-3 minute startup time (if write access granted)
- **Security:** Must relax security contexts to run
- **Reliability:** Pods crash loop indefinitely
- **Scalability:** Embedded PostgreSQL prevents multi-replica deployments

---

## Solution Options

### Option 1: Pre-Built Image (✅ RECOMMENDED)

**Approach:** Build the application inside the Dockerfile instead of at runtime.

**Architecture:**

```dockerfile
# Stage 1: Build prompts.chat
FROM node:18-alpine AS builder
RUN git clone https://github.com/f/prompts.chat /app
WORKDIR /app
RUN npm ci && npm run build

# Stage 2: Production runtime  
FROM node:18-alpine
COPY --from=builder /app/.next/standalone /app
COPY --from=builder /app/.next/static /app/.next/static
COPY --from=builder /app/public /app/public
# Add Zeta customizations
ENV PCHAT_NAME="Zeta Prompt Library"
EXPOSE 3000
CMD ["node", "/app/server.js"]
```

**Pros:**

- ✅ **No runtime build** - Fast startup (<10 seconds)
- ✅ **No write permissions needed** - Immutable filesystem
- ✅ **Production-ready** - Follows 12-factor app principles
- ✅ **Secure** - Can enforce strict security contexts
- ✅ **Scalable** - Multiple replicas without conflicts
- ✅ **Cloud-native** - Standard Kubernetes deployment pattern

**Cons:**

- ❌ Larger image size (~500MB vs ~200MB base)
- ❌ Requires rebuilding image for code changes (not config changes)

**Effort:** Medium (2-3 hours)

---

### Option 2: PersistentVolume + Init Container

**Approach:** Add PersistentVolume for `/data` and use init container to prepare filesystem.

**Architecture:**

```yaml
# PersistentVolumeClaim
volumeClaimTemplates:
  - metadata:
      name: app-data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 2Gi

# Init Container
initContainers:
  - name: prepare-data
    image: busybox
    command: ["sh", "-c", "chown -R 1000:1000 /data"]
    volumeMounts:
      - name: app-data
        mountPath: /data
```

**Pros:**

- ✅ Minimal changes to base image workflow
- ✅ Preserves upstream design intent

**Cons:**

- ❌ **Slow startup** - 2-3 minute build on every pod restart
- ❌ **Complex** - Requires PVC, init container, volume management
- ❌ **Not stateless** - Violates cloud-native principles
- ❌ **Storage costs** - PVC needed for each environment
- ❌ **Not scalable** - Each replica builds independently

**Effort:** Medium (2-3 hours)

---

### Option 3: Sidecar PostgreSQL Pattern

**Approach:** Run PostgreSQL as sidecar container in the same pod.

**Architecture:**

```yaml
containers:
  - name: app
    image: zeta-prompt-library
  - name: postgres
    image: postgres:15-alpine
    env:
      - name: POSTGRES_PASSWORD
        value: changeme
```

**Pros:**

- ✅ Matches base image expectations (local PostgreSQL)
- ✅ Simple configuration

**Cons:**

- ❌ **Anti-pattern** - One process per container violated
- ❌ **Resource waste** - PostgreSQL in every pod
- ❌ **Data loss** - Database destroyed on pod restart
- ❌ **Not scalable** - Each pod has isolated database
- ❌ **Still needs write access** - Runtime build issue remains

**Effort:** Low (1 hour)  
**Viability:** ❌ Not recommended

---

### Option 4: Fork Upstream & Refactor

**Approach:** Fork `prompts.chat` repository and refactor for Kubernetes deployment.

**Changes:**

- Remove embedded PostgreSQL
- Remove runtime build process
- Use environment-based configuration
- Create Kubernetes-native startup script

**Pros:**

- ✅ Complete control over codebase
- ✅ Optimal for our needs

**Cons:**

- ❌ **High maintenance** - Must merge upstream changes manually
- ❌ **Divergence risk** - Lose upstream fixes/features
- ❌ **Time investment** - Weeks of development

**Effort:** High (2-3 weeks)  
**Viability:** ❌ Overkill for current needs

---

## Decision

**Selected:** **Option 1 - Pre-Built Image**

**Rationale:**

1. **Production-ready:** Aligns with Kubernetes and cloud-native best practices
2. **Performance:** Fast startup times critical for auto-scaling
3. **Security:** Can enforce strict security contexts without workarounds
4. **Maintainability:** Standard Docker multi-stage build pattern
5. **Balance:** Medium effort with high return on investment

**Implementation Plan:**

1. Create new multi-stage Dockerfile
2. Build application at image build time
3. Copy only runtime artifacts to final image
4. Add Zeta branding customizations
5. Test with Kubernetes deployment
6. Update Makefile and documentation

**Trade-offs Accepted:**

- Slightly larger image size (acceptable with modern container registries)
- Image rebuild needed for code changes (config changes still dynamic via env vars)

**Rejected Alternatives:**

- Option 2: Too complex, performance issues
- Option 3: Anti-pattern, not scalable
- Option 4: Overengineered for current requirements

---

## Related Issues

- [x] Issue: PostgreSQL connection errors → **Solved:** Added PostgreSQL StatefulSet for Kubernetes
- [x] Issue: Missing `olympus-cluster-properties-configmap` → **Solved:** Created ConfigMap for local env
- [ ] Issue: Container write permission errors → **In Progress:** Implementing pre-built image
- [ ] Issue: Health check path mismatch → **Pending:** Verify `/api/health` vs `/status`

---

## Future Considerations

### When to Revisit

- If upstream `prompts.chat` releases Kubernetes-ready image
- If we need more frequent code updates without rebuild
- If image size becomes a constraint (unlikely)

### Monitoring

- Track upstream repository for architectural changes
- Monitor container startup times in production
- Review security context requirements quarterly

We **could** use `ghcr.io/f/prompts.chat`, but it's **fundamentally incompatible** with our K8s production requirements.

## The Problem with `ghcr.io/f/prompts.chat`

That image uses **Pattern B (Runtime Configuration)**:

```dockerfile
# What ghcr.io/f/prompts.chat does:
FROM node:24-bookworm-slim
COPY bootstrap.sh /bootstrap.sh
CMD ["/bootstrap.sh"]

# bootstrap.sh runs on EVERY container start:
1. Initialize embedded PostgreSQL
2. Clone prompts.chat repo
3. Install 1249 npm packages
4. Generate config from env vars
5. Build Next.js app
6. Start server
```

**Startup time:** 2-3 minutes ⏱️

## Why This Won't Work for Zeta

| Requirement | `ghcr.io/f/prompts.chat` | Our Custom Image |
|-------------|--------------------------|------------------|
| **Startup time** | ❌ 2-3 minutes | ✅ 10-15 seconds |
| **PostgreSQL** | ❌ Embedded (single instance) | ✅ External (managed) |
| **Persistence** | ❌ Needs volume mount | ✅ Stateless |
| **Horizontal scaling** | ❌ Can't share volumes | ✅ Multiple pods work |
| **Immutable config** | ❌ Runtime env vars | ✅ Baked into image |
| **K8s health checks** | ❌ Fail during 3-min build | ✅ Fast, reliable |
| **Zero-downtime updates** | ❌ 3-min startup kills rolling update | ✅ Works perfectly |
| **CI/CD** | ❌ Version control nightmare | ✅ Clean image versioning |

## What Happens If You Try

```yaml
# If you used their image in K8s:
image: ghcr.io/f/prompts.chat:latest
```

**Result:**

1. Pod starts
2. Health check fails (app not ready yet)
3. K8s kills pod after 60s (thinking it crashed)
4. Pod restarts
5. Repeat forever = **CrashLoopBackOff** ♾️

## The Trade-Off

**Their image:**

- ✅ Quick to test locally (`docker run ghcr.io/f/prompts.chat`)
- ❌ Not production-ready for K8s

**Our approach:**

- ❌ Slow first build (3-5 min one-time cost)
- ✅ Production-ready, fast, scalable

## Could We Use It As a Base Image?

```dockerfile
FROM ghcr.io/f/prompts.chat AS base
# Copy their built app?
```

**No**, because their image:

- Doesn't contain a pre-built app (builds at runtime)
- Contains PostgreSQL setup we don't need
- Contains bootstrap.sh we don't want to run

We'd end up **rebuilding everything anyway**, so cloning from source is cleaner.

## Bottom Line

**The slow build is the price of production readiness.** You're paying 3-5 minutes once to get:

- 10-second container startup
- Horizontal scaling
- Zero-downtime updates
- Proper K8s integration

This is the **correct architectural choice** for your use case.
