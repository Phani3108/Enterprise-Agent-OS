# Helm Chart: Zeta Prompt Library

## Overview

Helm chart for deploying Zeta Prompt Library - an AI prompt curation platform based on prompts.chat.

## Prerequisites

- Kubernetes 1.19+
- Helm 3.0+
- PostgreSQL database (external or in-cluster)

## Installation

### Local Testing (Kubernetes)

```bash
# Deploy with local values
make helm-deploy

# Or manually
helm install zeta-prompt-library ./helm-chart \
  --namespace zeta-prompt-library \
  --create-namespace \
  --values helm-chart/values-local.yaml
```

### Production Deployment

```bash
helm install zeta-prompt-library ./helm-chart \
  --namespace zeta-prompt-library \
  --create-namespace \
  --set secrets.DATABASE_URL="postgresql://..." \
  --set secrets.AUTH_SECRET="$(openssl rand -base64 32)" \
  --set secrets.AUTH_GITHUB_ID="your-client-id" \
  --set secrets.AUTH_GITHUB_SECRET="your-client-secret"
```

## Configuration

### Key Values

| Parameter | Description | Default |
|-----------|-------------|---------|
| `replicaCount` | Number of replicas | `1` |
| `image.repository` | Image registry | `harbor.zeta.tech` |
| `image.tag` | Image tag | `0.1.0` |
| `service.port` | Service port | `3000` |
| `ingress.enabled` | Enable ingress | `true` |
| `ingress.hosts[0].host` | Hostname | `prompts.zeta.tech` |

### Branding Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `envProperties.PCHAT_NAME` | Application name | `Zeta Prompt Library` |
| `envProperties.PCHAT_DESCRIPTION` | Description | `Curated AI prompts...` |
| `envProperties.PCHAT_COLOR` | Primary color | `#6366f1` |
| `envProperties.PCHAT_AUTH_PROVIDERS` | Auth providers | `github` |

### Secrets

| Parameter | Description | Required |
|-----------|-------------|----------|
| `secrets.DATABASE_URL` | PostgreSQL connection string | Yes |
| `secrets.AUTH_SECRET` | NextAuth.js secret | Yes |
| `secrets.AUTH_GITHUB_ID` | GitHub OAuth client ID | Yes |
| `secrets.AUTH_GITHUB_SECRET` | GitHub OAuth client secret | Yes |
| `secrets.OPENAI_API_KEY` | OpenAI API key (optional) | No |

## Upgrading

```bash
# Local
make helm-upgrade

# Production
helm upgrade zeta-prompt-library ./helm-chart \
  --namespace zeta-prompt-library
```

## Uninstalling

```bash
# Local
make helm-clean

# Manual
helm uninstall zeta-prompt-library --namespace zeta-prompt-library
```

## Dependencies

This chart uses the Zeta common chart library for standardized templates:
- Deployment (common.deployment-springboot)
- Service (common.service)
- ConfigMap (common.env-configmap)

## Health Checks

- **Liveness Probe**: `/api/health` (60s initial delay)
- **Readiness Probe**: `/api/health` (30s initial delay)

## Support

For issues and questions, contact the StarLabs team or open a ticket in JIRA with tag `SPE-33793`.
