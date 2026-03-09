# Developer Guide

This guide explains how to build, test, and deploy the Zeta Prompt Library locally.

## Prerequisites

Before you start, ensure you have:

- **Docker** and **Docker Compose** installed
- **kubectl** and **Helm** (for Kubernetes deployments)
- **Colima** running (preferred local Kubernetes environment)
- **Make** (comes with macOS/Linux)

## Quick Start

### First-Time Setup

```bash
# 1. Start infrastructure (Colima + Docker + Kubernetes)
make init

# 2. Set up environment (checks prerequisites, creates .env, pulls base image)
make setup

# 3. Deploy locally with Docker Compose
make compose-install

# 4. Verify it's running
make compose-test

# Access the application at http://localhost:4444
```

**Note:** First run takes 2-3 minutes as it builds from the upstream prompts.chat image (clones repo, installs 1249 packages, runs Next.js build, applies 23 database migrations, seeds data).

---

## Available Commands

### Infrastructure Management

| Command | Purpose |
|---------|---------|
| `make init` | Start Colima, Docker daemon, and Kubernetes cluster |
| `make setup` | Check prerequisites, create .env file, pull base image |

### Building & Linting

| Command | Purpose |
|---------|---------|
| `make build` | Build Docker image with version and commit metadata |
| `make build-no-cache` | Build Docker image without using cache (slower but clean) |
| `make lint` | Validate Docker Compose YAML, Dockerfile, and Makefile syntax |

### Testing & Validation

| Command | Purpose |
|---------|---------|
| `make test` | Auto-detect deployment mode (compose/helm) and run health checks |
| `make compose-test` | Run health check for Docker Compose deployment (90s timeout) |
| `make helm-test` | Run health check for Kubernetes deployment |

---

## Docker Compose Workflow

Docker Compose is the **quick local testing** method. It's fast and simple.

### Lifecycle Commands

These follow a Maven-style lifecycle pattern where each phase builds on the previous:

```bash
make compose-validate    # Phase 1: Validate docker-compose.yml syntax
make compose-compile     # Phase 2: validate → build Docker image
make compose-install     # Phase 3: compile → start containers
make compose-verify      # Phase 4: install → verify deployment health
```

**Shortcut:** `make compose-install` runs all phases automatically (validate → compile → install).

### Operational Commands

| Command | Purpose |
|---------|---------|
| `make c` | Alias for compose-install (quick deploy) |
| `make c-logs` | Stream container logs (follow mode) |
| `make compose-logs` | View container logs |
| `make compose-restart` | Restart all containers |
| `make compose-shell` | Open shell in app container |
| `make compose-status` | Show container status |
| `make compose-clean` | Stop and remove containers, networks, volumes |

### Example Workflow

```bash
# Deploy
make c

# Check logs
make c-logs

# Make a change to code, rebuild and restart
make build && make compose-restart

# Clean up when done
make compose-clean
```

---

## Kubernetes (Helm) Workflow

Kubernetes deployment provides a **production-like local environment** with full Helm chart validation.

### Lifecycle Commands

```bash
make helm-validate       # Phase 1: Validate values.yaml syntax
make helm-compile        # Phase 2: validate → build image → lint chart
make helm-package        # Phase 3: compile → package Helm chart
make helm-verify         # Phase 4: package → dry-run deployment
make helm-install        # Phase 5: verify → deploy to Kubernetes
```

**Shortcut:** `make helm-install` runs all phases automatically.

### Operational Commands

| Command | Purpose |
|---------|---------|
| `make h` | Alias for helm-install (quick deploy) |
| `make h-logs` | Stream pod logs (follow mode) |
| `make helm-logs` | View pod logs |
| `make helm-restart` | Restart pods (rollout restart) |
| `make helm-status` | Show Helm release status |
| `make helm-shell` | Open shell in app pod |
| `make helm-port-forward` | Forward port 8080 to pod (background) |
| `make helm-clean` | Uninstall Helm release and clean resources |

### Example Workflow

```bash
# Deploy
make h

# Port forward to access (runs in background)
make helm-port-forward

# Access at http://localhost:8080

# Check logs
make h-logs

# Clean up
make helm-clean
```

---

## Environment Configuration

All configuration is in `.env` file (created by `make setup`). Key variables:

```bash
# Database
DATABASE_URL=postgresql://...
POSTGRES_USER=zeta_prompt_user
POSTGRES_PASSWORD=...
POSTGRES_DB=zeta_prompts

# Authentication (GitHub SSO)
AUTH_SECRET=...
AUTH_GITHUB_ID=...
AUTH_GITHUB_SECRET=...

# Branding (Zeta customization)
PCHAT_BRANDING_NAME="Zeta Prompt Library"
PCHAT_BRANDING_LOGO_URL="/zeta-logo.svg"
PCHAT_AUTH_GITHUB_ENABLED=true
PCHAT_FEATURES_PRIVATE_PROMPTS_ENABLED=true
```

**Important:** Never commit `.env` to git. It's in `.gitignore`.

---

## Common Workflows

### Local Development Loop

```bash
# 1. Start fresh
make compose-clean
make compose-install

# 2. Make code changes

# 3. Rebuild and restart
make build && make compose-restart

# 4. Check logs
make c-logs

# 5. Validate configuration
make lint
```

### Testing Before CI/CD

```bash
# Lint all config files
make lint

# Build without cache (clean build)
make build-no-cache

# Full lifecycle test (compose)
make compose-clean
make compose-install
make compose-test

# Or Helm
make helm-clean
make helm-install
make helm-test
```

### Debugging

```bash
# Check what's running
make compose-status      # or make helm-status

# View logs
make c-logs              # or make h-logs

# Open shell in container
make compose-shell       # or make helm-shell

# Inside shell, you can:
# - Check files: ls -la /data/app
# - Inspect env: env | grep PCHAT
# - Check process: ps aux
# - View app logs: cat /var/log/...
```

---

## Help & Documentation

```bash
# Show all available commands with descriptions
make help

# See this guide
cat DEVELOPING.md

# See project overview
cat README.md
```

---

## Important Notes for Developers

### Base Image

- Uses `ghcr.io/f/prompts.chat:latest` as foundation
- Extends with Zeta branding via environment variables
- First run clones upstream repo and builds from source (~2-3 min)

### Ports

- **Compose:** Application runs on `localhost:4444` (external) → `3000` (internal)
- **Helm:** Use `make helm-port-forward` to access on `localhost:8080`

### Database

- PostgreSQL 15 with Prisma ORM
- 23 migrations applied automatically on startup
- Seeds sample data: 1154 prompts, 44 categories, 199 tags, 571 users

### Kubernetes Context

- **MUST** use `colima` context for local development
- Makefile enforces this safety check
- Production deployments use different contexts (configured in CI/CD)

### Registry

- Local images: `zeta-prompt-library:latest`
- AWS ECR: `813361731051.dkr.ecr.ap-south-1.amazonaws.com/zeta-prompt-library`
- Pushed by CI/CD (Jenkins) on successful builds

### Testing Timeouts

- Health checks use 90-second timeout (accounts for first-run build time)
- If tests fail with timeout, it's likely the app is still building
- Check logs with `make c-logs` or `make h-logs`

---

## Important Notes for AI Agents

When working on this project:

1. **Makefile is the single source of truth** - All workflows are orchestrated through make targets
2. **Always run linter before committing** - `make lint` validates all config files
3. **Use lifecycle phases** - `make compose-install` or `make helm-install` (not individual steps)
4. **First run is slow** - Building from upstream takes 2-3 minutes, this is normal
5. **Auto-detection works** - `make test` automatically detects compose vs helm mode
6. **Port mapping differs** - Compose uses 4444, Helm needs port-forward to 8080
7. **Context safety** - K8s operations require colima context (enforced by Makefile)
8. **Short aliases exist** - Use `make c` (compose) or `make h` (helm) for quick deploys

---

## Troubleshooting

### "No deployment detected" when running `make test`

- Run `make compose-install` or `make helm-install` first
- Verify containers/pods are running: `make compose-status` or `make helm-status`

### Health check fails with timeout

- Check logs: `make c-logs` or `make h-logs`
- Likely app is still building on first run (wait 2-3 min)
- Verify database is healthy: `docker compose ps` (should show "healthy" status)

### Cannot access application

- **Compose:** Check <http://localhost:4444> (not 3000)
- **Helm:** Run `make helm-port-forward` first, then access <http://localhost:8080>

### Kubernetes context errors

- Ensure Colima is running: `make init`
- Check context: `kubectl config current-context` (should be "colima")
- Switch context: `kubectl config use-context colima`

### Image build fails

- Try clean build: `make build-no-cache`
- Ensure Docker has enough resources (4GB+ RAM recommended)
- Check Docker daemon: `docker ps` should work

### Database connection errors

- Verify .env file exists: `ls -la .env`
- Check DATABASE_URL is set correctly
- For compose: Ensure db container is healthy: `docker compose ps`
