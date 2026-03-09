# Zeta Prompt Library - Implementation Plan

## Overview
This document outlines the step-by-step plan to scaffold the zeta-prompt-library project following Zeta organization's standards and patterns, using `agentic-cde-workspace-provisioner` as the reference template.

### Key Principle
Just as `agentic-cde-workspace-provisioner` internally uses `ghcr.io/coder/coder`, `zeta-prompt-library` will internally use `ghcr.io/f/prompts.chat`.

---

## Phase 1: Foundation & Structure

### Step 1: Directory Structure Setup
**Objective:** Create the standard Zeta project structure

```
zeta-prompt-library/
├── .github/
│   ├── copilot-instructions.md
│   └── instructions/
│       └── commit-message.instructions.md
├── helm-chart/
│   ├── Chart.yaml
│   ├── values.yaml
│   ├── values-local.yaml
│   └── templates/
│       ├── configmap-envs.yaml
│       ├── deployment.yaml
│       ├── service.yaml
│       ├── secret.yaml
│       └── ingress.yaml
├── scripts/
│   ├── entrypoint-wrapper.sh
│   └── health-check.sh
├── docs/
│   └── architecture.md
├── .dockerignore
├── .gitignore
├── AGENTS.md
├── CODEOWNERS
├── ci.yaml
├── compose.yml
├── Dockerfile
├── Jenkinsfile
├── Makefile
├── MAKEFILE_GUIDE.md
├── README.md
└── SETUP_GUIDE.md
```

**Files to create:**
- New: `.dockerignore`, `compose.yml`, `Dockerfile`, `Makefile`, `Jenkinsfile`, `ci.yaml`
- Preserve: `AGENTS.md`, `README.md` (enhance existing)
- Add: `CODEOWNERS`, `SETUP_GUIDE.md`, `MAKEFILE_GUIDE.md`

---

## Phase 2: Docker Configuration

### Step 2: Dockerfile
**Objective:** Create production Dockerfile based on `ghcr.io/f/prompts.chat`

**Key aspects:**
```dockerfile
FROM ghcr.io/f/prompts.chat:latest

ARG app=zeta-prompt-library
ARG version
ARG lastCommitHash
ARG lastCommitAuthorEmail

ENV ARTIFACT_NAME=$app
ENV ARTIFACT_VERSION=$version
ENV ARTIFACT_COMMIT_ABR=$lastCommitHash
ENV ARTIFACT_COMMITTER=$lastCommitAuthorEmail

# Zeta-specific configuration
ENV PCHAT_NAME="Zeta Prompt Library"
ENV PCHAT_DESCRIPTION="Curated AI prompts for Zeta organization"
ENV PCHAT_COLOR="#6366f1"
ENV PCHAT_AUTH_PROVIDERS="github"

# Copy custom branding assets
COPY --chown=node:node public/zeta-logo.svg /data/app/public/logo.svg
COPY --chown=node:node prompts.config.ts /data/app/prompts.config.ts

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

EXPOSE 3000
```

**Environment variables to support:**
- `PCHAT_NAME`, `PCHAT_DESCRIPTION`, `PCHAT_COLOR` (branding)
- `PCHAT_AUTH_PROVIDERS`, `PCHAT_ALLOW_REGISTRATION` (auth)
- `PCHAT_LOCALES`, `PCHAT_DEFAULT_LOCALE` (i18n)
- `PCHAT_FEATURE_*` (features toggle)
- `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`
- `DATABASE_URL` (PostgreSQL connection)
- `OPENAI_API_KEY` (optional AI features)

---

### Step 3: Docker Compose
**Objective:** Create local development/testing environment

**Services:**
1. **zeta-prompt-library-db** (PostgreSQL 15)
   - Environment: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
   - Volume: `zeta-prompt-library-db-data:/var/lib/postgresql/data`
   - Health check with retry logic

2. **zeta-prompt-library** (main app)
   - Depends on: `zeta-prompt-library-db`
   - Ports: `4444:3000`
   - Environment variables loaded from `.env`
   - Health check: `/api/health` endpoint

**Network:**
- Bridge network: `zeta-prompt-library-network`

---

## Phase 3: Kubernetes Deployment

### Step 4: Helm Chart Structure
**Objective:** Create production-ready Helm chart

**Chart.yaml:**
```yaml
apiVersion: v2
name: zeta-prompt-library
description: Helm chart for Zeta Prompt Library - AI prompt curation platform
version: 0.1.0
icon: https://prompts.chat/favicon/apple-touch-icon.png
appVersion: 1.0.0
type: application
dependencies:
- name: common
  version: 1.0.121
  repository: '@chartrepo'
```

**Templates to create:**
- `deployment.yaml` - App deployment with health checks
- `service.yaml` - ClusterIP service on port 3000
- `ingress.yaml` - External access configuration
- `configmap-envs.yaml` - Non-sensitive configuration
- `secret.yaml` - Sensitive credentials (GitHub OAuth, DB password)
- `pvc.yaml` - Persistent storage for prompts data

**values.yaml structure:**
```yaml
replicaCount: 1
image:
  repository: zeta-prompt-library
  tag: latest
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 3000

ingress:
  enabled: true
  host: prompts.zeta.tech

database:
  host: postgres-service
  port: 5432
  name: zeta_prompts
  username: zeta_admin

branding:
  name: "Zeta Prompt Library"
  description: "AI prompt curation for Zeta teams"
  color: "#6366f1"

auth:
  providers: "github"
  allowRegistration: false

features:
  privatePrompts: true
  changeRequests: true
  aiSearch: false
```

---

## Phase 4: Build & Deployment Automation

### Step 5: Makefile
**Objective:** Provide Maven-style lifecycle phases for developers

**Key targets:**

```makefile
# Common Targets
setup                   # Setup development environment
build                   # Build Docker image
clean                   # Clean artifacts
terraform-init          # N/A for this project (no Terraform)

# Docker Provider Lifecycle (dp-*)
dp-validate             # Validate compose.yml and .env
dp-compile              # Build Docker image
dp-install              # Start services (compile + up)
dp-verify               # Verify deployment health
dp-clean-lifecycle      # Full cleanup

# Kubernetes Provider Lifecycle (kp-*)
kp-validate             # Validate Helm chart
kp-compile              # Build image + lint chart
kp-package-phase        # Package Helm chart
kp-verify-phase         # Dry-run deployment
kp-install              # Deploy to local K8s
kp-deploy-phase         # Deploy to production K8s

# Docker Shortcuts (aliases)
dpl                     # Docker: deploy local
dpl-logs                # Docker: view logs
dpl-clean               # Docker: cleanup

# Kubernetes Shortcuts (aliases)
kpl                     # K8s: deploy local
kpl-logs                # K8s: view logs
kpl-clean               # K8s: cleanup
```

**Context safety:**
- K8s operations require `colima` context
- Fail-fast with helpful error messages

---

### Step 6: CI/CD Configuration

**ci.yaml:**
```yaml
prevVersion: null
currentVersion: null
branch: master
```

**Jenkinsfile structure:**
```groovy
pipeline {
    agent any
    
    environment {
        IMAGE_NAME = 'zeta-prompt-library'
        REGISTRY = 'harbor.zeta.tech'
    }
    
    stages {
        stage('Validate') {
            steps {
                sh 'make dp-validate'
            }
        }
        
        stage('Build') {
            steps {
                sh 'make build VERSION=${BUILD_NUMBER}'
            }
        }
        
        stage('Test') {
            steps {
                sh 'make dp-verify'
            }
        }
        
        stage('Push') {
            steps {
                sh 'docker push ${REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER}'
            }
        }
        
        stage('Deploy') {
            when {
                branch 'master'
            }
            steps {
                sh 'make kp-deploy-phase VERSION=${BUILD_NUMBER}'
            }
        }
    }
}
```

---

## Phase 5: Governance & Documentation

### Step 7: Governance Files

**CODEOWNERS:**
```
* @balamurugank_Zeta
/helm-chart/ @balamurugank_Zeta @devops-team
```

**.gitignore additions:**
```
# Build artifacts
*.tgz
.helm/

# Environment
.env
.env.local

# Kubernetes
kubeconfig
```

**.dockerignore:**
```
.git
.github
.env*
*.md
Makefile
Jenkinsfile
helm-chart/
docs/
```

---

### Step 8: Scripts

**scripts/entrypoint-wrapper.sh:**
- Health check endpoint wrapper
- Database migration trigger
- Graceful shutdown handler

**scripts/health-check.sh:**
- Validate database connectivity
- Check Next.js app readiness
- Return JSON health status

---

### Step 9: Documentation

**README.md enhancements:**
```markdown
# Zeta Prompt Library

> AI prompt curation platform for Zeta organization

## Quick Start

### Docker (Local Testing)
```bash
make setup
make dpl        # Deploy locally
make dpl-logs   # View logs
```

### Kubernetes (Production)
```bash
make kpl        # Deploy to local K8s
make kpl-logs   # View logs
```

## Architecture
Built on [prompts.chat](https://github.com/f/prompts.chat) with Zeta-specific:
- Custom branding
- GitHub SSO integration
- Private prompt management
```

**SETUP_GUIDE.md:**
- Prerequisites (Docker, kubectl, Helm)
- Environment setup (.env configuration)
- Local development workflow
- Troubleshooting

**MAKEFILE_GUIDE.md:**
- Target explanations
- Lifecycle phase descriptions
- Common workflows
- Examples

---

## Phase 6: Configuration Templates

### Step 10: .env.example
```bash
# Database
POSTGRES_USER=zeta_admin
POSTGRES_PASSWORD=changeme
POSTGRES_DB=zeta_prompts
DATABASE_URL=postgresql://zeta_admin:changeme@zeta-prompt-library-db:5432/zeta_prompts

# Authentication
AUTH_SECRET=generate-with-openssl-rand-base64-32
AUTH_GITHUB_ID=your-github-oauth-app-id
AUTH_GITHUB_SECRET=your-github-oauth-app-secret

# Branding (optional, can be set in Dockerfile)
PCHAT_NAME="Zeta Prompt Library"
PCHAT_DESCRIPTION="AI prompt curation for Zeta teams"
PCHAT_COLOR="#6366f1"
PCHAT_AUTH_PROVIDERS="github"
PCHAT_ALLOW_REGISTRATION="false"

# Features
PCHAT_FEATURE_PRIVATE_PROMPTS="true"
PCHAT_FEATURE_CHANGE_REQUESTS="true"
PCHAT_FEATURE_AI_SEARCH="false"

# Optional: AI Features
# OPENAI_API_KEY=sk-...
```

---

## Phase 7: GitHub Integration

### Step 11: GitHub Configuration

**.github/copilot-instructions.md:**
```markdown
# GitHub Copilot Instructions

## Project Context
**Zeta Prompt Library** is an AI prompt curation platform based on prompts.chat,
customized for Zeta organization with private prompt management and GitHub SSO.

## Base Image
- Uses `ghcr.io/f/prompts.chat` as base
- Similar to how agentic-cde uses `ghcr.io/coder/coder`

## Development Tools
- Docker/Colima for local testing
- Helm for Kubernetes deployment
- Make for common workflows

## Commit Convention
Format: `[SPE-33793] <type>(<scope>): <subject>`
```

**.github/instructions/commit-message.instructions.md:**
- Standard Zeta commit message format
- JIRA ticket integration
- Conventional commit types

---

## Implementation Checklist

### ✅ Pre-Implementation
- [x] Read reference files from agentic-cde-workspace-provisioner
- [x] Read prompts.chat Docker documentation
- [x] Create implementation plan
- [ ] Review plan with team
- [ ] Get approval to proceed

### 🔨 Phase 1: Foundation (Steps 1)
- [ ] Create directory structure
- [ ] Setup .gitignore, .dockerignore

### 🐳 Phase 2: Docker (Steps 2-3)
- [ ] Create Dockerfile
- [ ] Create compose.yml
- [ ] Create .env.example
- [ ] Test local Docker deployment

### ☸️ Phase 3: Kubernetes (Step 4)
- [ ] Create helm-chart/Chart.yaml
- [ ] Create helm-chart/values.yaml
- [ ] Create Helm templates
- [ ] Test local K8s deployment

### 🤖 Phase 4: Automation (Steps 5-6)
- [ ] Create Makefile with lifecycle phases
- [ ] Create ci.yaml
- [ ] Create Jenkinsfile
- [ ] Test build automation

### 📋 Phase 5: Governance (Steps 7-9)
- [ ] Create CODEOWNERS
- [ ] Create utility scripts
- [ ] Enhance README.md
- [ ] Create SETUP_GUIDE.md
- [ ] Create MAKEFILE_GUIDE.md

### 🎨 Phase 6: Configuration (Step 10)
- [ ] Create .env.example
- [ ] Document all environment variables

### 🐙 Phase 7: GitHub (Step 11)
- [ ] Create .github/copilot-instructions.md
- [ ] Create commit message instructions
- [ ] Add PR templates (if needed)

### ✅ Final Validation
- [ ] Run `make setup`
- [ ] Run `make dpl` and verify
- [ ] Run `make kpl` and verify
- [ ] Run linters
- [ ] Create test commit with proper format
- [ ] Document any deviations from plan

---

## Key Differences from agentic-cde-workspace-provisioner

| Aspect | agentic-cde | zeta-prompt-library |
|--------|-------------|---------------------|
| Base Image | `ghcr.io/coder/coder` | `ghcr.io/f/prompts.chat` |
| Purpose | Workspace provisioning | Prompt library |
| Terraform | Yes (workspace templates) | No |
| Docker socket | Required (DinD) | Not required |
| Port | 8080 | 3000 (internal), 4444 (compose) |
| Artifacts | IDE extensions, toolkits | Custom prompts, branding |
| Database | PostgreSQL (Coder DB) | PostgreSQL (prompts DB) |
| Init container | Yes (for K8s artifacts) | No (simpler deployment) |

---

## Next Steps

1. Review this plan with stakeholders
2. Get approval for each phase
3. Start with Phase 1 - Foundation
4. Validate each phase before proceeding
5. Document any issues/deviations
6. Update this plan as needed

---

**Created:** 2026-01-31  
**Author:** Bala (with AI assistance)  
**Status:** Draft - Awaiting Review
