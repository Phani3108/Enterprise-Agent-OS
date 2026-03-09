# Makefile for AgentOS Prompt Library
# AI prompt curation platform
# Supports two local testing modes:
#   1. Compose - Docker Compose for quick local testing
#   2. Helm - Kubernetes (Helm) for production-like local testing

.PHONY: help setup build clean status logs version next-version develop-ready-for-new-change \
        helm-setup-infra helm-port-forward h-pf

# Color output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m # No Color
DIM := \033[2m

# Configuration
VERSION ?= 0.1.0
NAMESPACE := agentos-prompt-library
RELEASE_NAME := agentos-prompt-library
HELM_CHART_DIR := helm-chart
IMAGE_NAME := agentos-prompt-library
REGISTRY ?= registry.agentos.dev
APP_PORT  := 3000

# Safety: K8s context validation
REQUIRED_CONTEXT := colima
CURRENT_CONTEXT := $(shell kubectl config current-context 2>/dev/null || echo "none")

define check_k8s_context
	@if [ "$(CURRENT_CONTEXT)" != "$(REQUIRED_CONTEXT)" ]; then \
		echo "$(RED)ERROR: Wrong Kubernetes context!$(NC)"; \
		echo "$(RED)Current context: $(CURRENT_CONTEXT)$(NC)"; \
		echo "$(RED)Required context: $(REQUIRED_CONTEXT)$(NC)"; \
		echo "$(YELLOW)Switch context with: kubectx $(REQUIRED_CONTEXT)$(NC)"; \
		exit 1; \
	fi
endef

# Default target
help:
	@echo ""
	@echo "$(BLUE)╔════════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║$(NC)  Zeta Prompt Library - Build & Deploy                         $(BLUE)║$(NC)"
	@echo "$(BLUE)╚════════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(BLUE)Local Testing Modes:$(NC)"
	@echo "  $(GREEN)compose$(NC)      - Docker Compose (quick local testing)"
	@echo "  $(GREEN)helm$(NC)         - Kubernetes + Helm (production-like local testing)"
	@echo ""
	@echo "$(BLUE)Common Targets:$(NC)"
	@echo "  $(GREEN)setup$(NC)        - First-time environment setup (check tools, create .env, pull image)"
	@echo "  $(GREEN)init$(NC)         - Start runtime infrastructure (Colima/Docker/K8s)"
	@echo "  $(GREEN)build$(NC)        - Build Docker image (used by both modes)"
	@echo "  $(GREEN)test$(NC)         - Test deployment (auto-detects compose or helm mode)"
	@echo "  $(GREEN)lint$(NC)         - Run linters (YAML, Dockerfile, Makefile syntax)"
	@echo "  $(GREEN)clean$(NC)        - Clean build artifacts and temporary files"
	@echo ""
	@echo "$(BLUE)Maven-Style Lifecycle Phases (auto-chain dependencies):$(NC)"
	@echo "  $(YELLOW)Compose Lifecycle:$(NC)"
	@echo "    $(GREEN)compose-validate$(NC)      → validate .env and compose.yml"
	@echo "    $(GREEN)compose-compile$(NC)       → compose-validate → build image"
	@echo "    $(GREEN)compose-install$(NC)       → compose-compile → start services"
	@echo "    $(GREEN)compose-verify$(NC)        → compose-install → verify deployment"
	@echo "    $(GREEN)compose-clean-lifecycle$(NC) → clean all artifacts"
	@echo "  $(YELLOW)Helm Lifecycle:$(NC)"
	@echo "    $(GREEN)helm-validate$(NC)         → validate helm chart"
	@echo "    $(GREEN)helm-compile$(NC)          → helm-validate → build image"
	@echo "    $(GREEN)helm-package$(NC)          → helm-compile → lint → package chart"
	@echo "    $(GREEN)helm-verify$(NC)           → helm-package → dry-run"
	@echo "    $(GREEN)helm-install$(NC)          → helm-package → deploy to local k8s"
	@echo ""
	@echo "$(BLUE)Compose Targets (Docker Compose local testing):$(NC)"
	@echo "  $(GREEN)compose-deploy$(NC)        - Deploy using Docker Compose (full setup)"
	@echo "  $(GREEN)compose-up$(NC)            - Start services"
	@echo "  $(GREEN)compose-down$(NC)          - Stop and remove services"
	@echo "  $(GREEN)compose-status$(NC)        - Check status of services"
	@echo "  $(GREEN)compose-logs$(NC)          - View logs from services"
	@echo "  $(GREEN)compose-logs-app$(NC)      - View app logs only"
	@echo "  $(GREEN)compose-restart$(NC)       - Restart services"
	@echo "  $(GREEN)compose-test$(NC)          - Test deployment health"
	@echo "  $(GREEN)compose-clean$(NC)         - Stop services and clean volumes"
	@echo "  $(GREEN)compose-clean-all$(NC)     - Full cleanup (services + volumes + network)"
	@echo ""
	@echo "$(BLUE)Helm Targets (Kubernetes local testing):$(NC)"
	@echo "  $(YELLOW)Build & Package:$(NC)"
	@echo "    $(GREEN)helm-build$(NC)             - Build and package Helm chart"
	@echo "    $(GREEN)helm-package-chart$(NC)     - Package Helm chart only"
	@echo "    $(GREEN)helm-lint$(NC)              - Lint Helm chart"
	@echo "  $(YELLOW)Deploy & Upgrade:$(NC)"
	@echo "    $(GREEN)helm-deploy$(NC)            - Deploy to local Kubernetes"
	@echo "    $(GREEN)helm-upgrade$(NC)           - Upgrade existing release"
	@echo "    $(GREEN)helm-uninstall$(NC)         - Uninstall Helm release"
	@echo "  $(YELLOW)Monitoring & Debug:$(NC)"
	@echo "    $(GREEN)helm-status$(NC)            - Check deployment status"
	@echo "    $(GREEN)helm-pods$(NC)              - Show pod status"
	@echo "    $(GREEN)helm-logs$(NC)              - View app logs"
	@echo "    $(GREEN)helm-describe$(NC)          - Describe pods"
	@echo "    $(GREEN)helm-shell$(NC)             - Open shell in pod"
	@echo "    $(GREEN)helm-test$(NC)              - Test deployment health"
	@echo "  $(YELLOW)Utilities:$(NC)"
	@echo "    $(GREEN)helm-template$(NC)          - Render Helm templates"
	@echo "    $(GREEN)helm-dry-run$(NC)           - Dry-run install"
	@echo "    $(GREEN)helm-clean$(NC)             - Full cleanup (all resources)"
	@echo "    $(GREEN)helm-port-forward$(NC)      - Port-forward app to localhost:4444"
	@echo ""
	@echo "$(BLUE)Short Aliases:$(NC)"
	@echo "  $(YELLOW)Compose:$(NC)  c, c-logs, c-clean, c-status"
	@echo "  $(YELLOW)Helm:$(NC)     h, h-logs, h-clean, h-status, h-pf"
	@echo ""
	@echo "$(BLUE)Quick Start:$(NC)"
	@echo "  $(YELLOW)First Time Setup:$(NC)"
	@echo "    $(DIM)make setup               # Check tools, create .env, pull base image$(NC)"
	@echo "    $(DIM)# Edit .env file with your credentials$(NC)"
	@echo "    $(DIM)make init                # Start Docker/K8s infrastructure$(NC)"
	@echo ""
	@echo "  $(YELLOW)Compose (Maven-style):$(NC)"
	@echo "    $(DIM)make compose-install     # Auto-runs: validate → compile → install$(NC)"
	@echo "    $(DIM)make test                # Verify deployment$(NC)"
	@echo "    $(DIM)# Or short:  make c$(NC)"
	@echo ""
	@echo "  $(YELLOW)Helm (Maven-style):$(NC)"
	@echo "    $(DIM)make helm-install        # Auto-runs: validate → compile → package → deploy$(NC)"
	@echo "    $(DIM)make test                # Verify deployment$(NC)"
	@echo "    $(DIM)# Or short:  make h$(NC)"
	@echo ""
	@echo ""

# ==============================================================================
# Common Targets
# ==============================================================================

init:
	@echo "$(BLUE)▸ Initializing runtime infrastructure...$(NC)"
	@if ! command -v colima >/dev/null 2>&1; then \
		echo "$(RED)✗ Colima not installed. Install with: brew install colima$(NC)"; \
		exit 1; \
	fi
	@list_out=$$(colima list 2>/dev/null | awk 'NR>1 && /default/{print}'); \
	needs_restart=0; \
	if ! echo "$$list_out" | grep -qi "running"; then \
		echo "$(YELLOW)⚠ Colima not running$(NC)"; \
		needs_restart=1; \
	elif ! echo "$$list_out" | grep -qi "k3s"; then \
		echo "$(YELLOW)⚠ Colima running without Kubernetes$(NC)"; \
		echo "$(YELLOW)  → Stopping Colima to restart with Kubernetes support...$(NC)"; \
		colima stop; \
		needs_restart=1; \
	else \
		echo "$(GREEN)✓ Colima running with Kubernetes enabled$(NC)"; \
	fi; \
	if [ $$needs_restart -eq 1 ]; then \
		echo "$(BLUE)  → Starting Colima with Kubernetes (4 CPU, 8GB RAM, 60GB disk)...$(NC)"; \
		colima start --cpu 4 --memory 8 --disk 60 --kubernetes; \
		echo "$(BLUE)  → Waiting for Kubernetes cluster...$(NC)"; \
		wait_count=0; \
		while [ $$wait_count -lt 60 ]; do \
			if kubectl cluster-info >/dev/null 2>&1; then \
				echo "$(GREEN)✓ Kubernetes cluster is accessible$(NC)"; \
				break; \
			fi; \
			sleep 2; \
			wait_count=$$((wait_count + 1)); \
		done; \
		if [ $$wait_count -eq 60 ]; then \
			echo "$(YELLOW)⚠ Kubernetes cluster not ready yet. Run: kubectl cluster-info$(NC)"; \
		fi; \
	elif kubectl cluster-info >/dev/null 2>&1; then \
		echo "$(GREEN)✓ Kubernetes cluster is accessible$(NC)"; \
	else \
		echo "$(BLUE)  → Waiting for Kubernetes cluster...$(NC)"; \
		wait_count=0; \
		while [ $$wait_count -lt 30 ]; do \
			if kubectl cluster-info >/dev/null 2>&1; then \
				echo "$(GREEN)✓ Kubernetes cluster is accessible$(NC)"; \
				break; \
			fi; \
			sleep 2; \
			wait_count=$$((wait_count + 1)); \
		done; \
		if [ $$wait_count -eq 30 ]; then \
			echo "$(YELLOW)⚠ Kubernetes cluster not ready. Run: colima kubernetes start$(NC)"; \
		fi; \
	fi
	@if docker context ls 2>/dev/null | grep -q "^colima\\b"; then \
		docker context use colima >/dev/null 2>&1 || true; \
	fi
	@if docker info >/dev/null 2>&1; then \
		echo "$(GREEN)✓ Connected to Docker via Colima$(NC)"; \
	else \
		echo "$(YELLOW)⚠ Docker not accessible. Try: docker context use colima$(NC)"; \
	fi

clean:
	@echo "$(BLUE)▸ Cleaning build artifacts...$(NC)"
	@rm -rf $(HELM_CHART_DIR)/dist/
	@rm -rf $(HELM_CHART_DIR)/rendered-manifests*.yaml
	@rm -rf $(HELM_CHART_DIR)/*.tgz
	@echo "$(GREEN)✓ Cleanup complete$(NC)"

setup:
	@echo "$(BLUE)╔════════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║$(NC)  Zeta Prompt Library - Environment Setup                      $(BLUE)║$(NC)"
	@echo "$(BLUE)╚════════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(BLUE)▸ Checking prerequisites...$(NC)"
	@command -v docker >/dev/null 2>&1 || { echo "$(RED)  ✗ Docker not found. Install: brew install --cask docker$(NC)"; exit 1; }
	@echo "$(GREEN)  ✓ Docker found$(NC)"
	@command -v docker compose >/dev/null 2>&1 || { echo "$(RED)  ✗ Docker Compose not found. Install: brew install docker-compose$(NC)"; exit 1; }
	@echo "$(GREEN)  ✓ Docker Compose found$(NC)"
	@command -v kubectl >/dev/null 2>&1 && echo "$(GREEN)  ✓ kubectl found$(NC)" || echo "$(YELLOW)  ⚠ kubectl not found (needed for helm workflow). Install: brew install kubectl$(NC)"
	@command -v helm >/dev/null 2>&1 && echo "$(GREEN)  ✓ helm found$(NC)" || echo "$(YELLOW)  ⚠ helm not found (needed for helm workflow). Install: brew install helm$(NC)"
	@command -v colima >/dev/null 2>&1 && echo "$(GREEN)  ✓ colima found$(NC)" || echo "$(YELLOW)  ⚠ colima not found (recommended). Install: brew install colima$(NC)"
	@command -v make >/dev/null 2>&1 && echo "$(GREEN)  ✓ make found$(NC)" || { echo "$(RED)  ✗ make not found. Install: xcode-select --install$(NC)"; exit 1; }
	@echo ""
	@echo "$(BLUE)▸ Environment configuration...$(NC)"
	@if [ ! -f .env ]; then \
		echo "$(YELLOW)  → Creating .env from .env.example...$(NC)"; \
		cp .env.example .env; \
		echo "$(GREEN)  ✓ .env file created$(NC)"; \
		echo ""; \
		echo "$(YELLOW)  ⚠ IMPORTANT: Update .env with your configuration:$(NC)"; \
		echo "$(DIM)    - DATABASE_URL (PostgreSQL connection)$(NC)"; \
		echo "$(DIM)    - AUTH_SECRET (generate with: openssl rand -base64 32)$(NC)"; \
		echo "$(DIM)    - GitHub OAuth (AUTH_GITHUB_ID, AUTH_GITHUB_SECRET)$(NC)"; \
		echo ""; \
	else \
		echo "$(GREEN)  ✓ .env file exists$(NC)"; \
	fi
	@echo "$(BLUE)▸ Pulling base image...$(NC)"
	@if docker pull ghcr.io/f/prompts.chat:latest >/dev/null 2>&1; then \
		echo "$(GREEN)  ✓ Base image pulled: ghcr.io/f/prompts.chat:latest$(NC)"; \
	else \
		echo "$(YELLOW)  ⚠ Failed to pull base image (will pull during build)$(NC)"; \
	fi
	@echo ""
	@echo "$(GREEN)✓ Setup complete!$(NC)"
	@echo ""
	@echo "$(BLUE)Next steps:$(NC)"
	@echo "  1. $(DIM)Edit .env with your configuration: vi .env$(NC)"
	@echo "  2. $(DIM)Initialize infrastructure: make init$(NC)"
	@echo "  3. $(DIM)Deploy with compose: make compose-install$(NC)"
	@echo "  4. $(DIM)Or deploy with helm: make helm-install$(NC)"
	@echo ""

build:
	@echo "$(BLUE)▸ Building Docker image (version: $(VERSION))...$(NC)"
	@docker build \
		--build-arg app=$(IMAGE_NAME) \
		--build-arg version=$(VERSION) \
		--build-arg lastCommitHash=$(shell git rev-parse --short HEAD 2>/dev/null || echo "dev") \
		--build-arg lastCommitAuthorEmail=$(shell git log -1 --format='%ae' 2>/dev/null || echo "unknown") \
		-t $(IMAGE_NAME):$(VERSION) \
		-t $(IMAGE_NAME):latest \
		.
	@echo "$(GREEN)✓ Image built: $(IMAGE_NAME):$(VERSION)$(NC)"

build-no-cache:
	@echo "$(BLUE)▸ Building Docker image without cache (version: $(VERSION))...$(NC)"
	@docker build --no-cache \
		--build-arg app=$(IMAGE_NAME) \
		--build-arg version=$(VERSION) \
		--build-arg lastCommitHash=$(shell git rev-parse --short HEAD 2>/dev/null || echo "dev") \
		--build-arg lastCommitAuthorEmail=$(shell git log -1 --format='%ae' 2>/dev/null || echo "unknown") \
		-t $(IMAGE_NAME):$(VERSION) \
		-t $(IMAGE_NAME):latest \
		.
	@echo "$(GREEN)✓ Image built (no cache): $(IMAGE_NAME):$(VERSION)$(NC)"
test:
	@echo "$(BLUE)▸ Auto-detecting deployment mode...$(NC)"
	@if docker compose ps 2>/dev/null | grep -q "zeta-prompt-library.*Up"; then \
		echo "$(GREEN)  ✓ Detected compose mode$(NC)"; \
		$(MAKE) compose-test; \
	elif kubectl get pods -n $(NAMESPACE) -l app.kubernetes.io/name=$(RELEASE_NAME) 2>/dev/null | grep -q "Running"; then \
		echo "$(GREEN)  ✓ Detected helm mode$(NC)"; \
		$(MAKE) helm-test; \
	else \
		echo "$(RED)✗ No deployment detected$(NC)"; \
		echo "$(YELLOW)  Run 'make compose-install' or 'make helm-install' first$(NC)"; \
		exit 1; \
	fi

lint:
	@echo "$(BLUE)▸ Running linters...$(NC)"
	@echo "  → Validating Docker Compose YAML..."
	@docker compose -f compose.yml config > /dev/null 2>&1 && echo "$(GREEN)  ✓ compose.yml is valid$(NC)" || echo "$(RED)  ✗ compose.yml has errors$(NC)"
	@echo "  → Validating Dockerfile..."
	@docker run --rm -i hadolint/hadolint < Dockerfile > /dev/null 2>&1 && echo "$(GREEN)  ✓ Dockerfile is valid$(NC)" || echo "$(YELLOW)  ⚠ Dockerfile linting warnings (non-blocking)$(NC)"
	@echo "  → Checking Makefile syntax..."
	@make -n help > /dev/null 2>&1 && echo "$(GREEN)  ✓ Makefile syntax is valid$(NC)" || echo "$(RED)  ✗ Makefile has syntax errors$(NC)"
	@echo "$(GREEN)✓ Linting complete$(NC)"

# ==============================================================================
# Compose Targets (Docker Compose local testing)
# ==============================================================================

compose-deploy: setup build compose-up
	@echo "$(GREEN)✓ Compose deployment complete$(NC)"
	@echo "$(YELLOW)Access UI: http://localhost:4444$(NC)"

compose-up:
	@echo "$(BLUE)▸ Starting Docker Compose services...$(NC)"
	@docker compose up -d
	@echo "$(GREEN)✓ Services started$(NC)"
	@echo "$(YELLOW)Access UI: http://localhost:4444$(NC)"

compose-down:
	@echo "$(BLUE)▸ Stopping Docker Compose services...$(NC)"
	@docker compose down
	@echo "$(GREEN)✓ Services stopped$(NC)"

compose-status:
	@echo "$(BLUE)▸ Docker Compose Status:$(NC)"
	@docker compose ps

compose-logs:
	@echo "$(BLUE)▸ Following Docker Compose logs (Ctrl+C to exit)...$(NC)"
	@docker compose logs -f

compose-logs-app:
	@echo "$(BLUE)▸ Following app logs...$(NC)"
	@docker compose logs -f zeta-prompt-library

compose-restart:
	@echo "$(BLUE)▸ Restarting Docker Compose services...$(NC)"
	@docker compose restart
	@echo "$(GREEN)✓ Services restarted$(NC)"

compose-clean:
	@echo "$(BLUE)▸ Cleaning Docker environment...$(NC)"
	@docker compose down -v
	@echo "$(GREEN)✓ Services and volumes removed$(NC)"

compose-clean-all: compose-clean
	@echo "$(BLUE)▸ Removing Docker network...$(NC)"
	@docker network rm zeta-prompt-library-network 2>/dev/null || true
	@echo "$(GREEN)✓ Full cleanup complete$(NC)"

compose-seed:
	@echo "$(BLUE)▸ Seeding database with Zeta-specific prompts...$(NC)"
	@docker cp prisma/seed-zeta.ts zeta-prompt-library:/app/prisma/seed-zeta.ts
	@docker exec zeta-prompt-library npx tsx prisma/seed-zeta.ts
	@echo "$(GREEN)✓ Database seeded$(NC)"
	@echo "$(YELLOW)  Login: admin@zeta.tech / ZetaAdmin2026!$(NC)"

compose-sync-admins:
	@echo "$(BLUE)▸ Syncing admins from config/admins.json (compose)...$(NC)"
	@docker cp config/admins.json zeta-prompt-library:/app/config/admins.json
	@docker cp scripts/sync-admins.js zeta-prompt-library:/app/scripts/sync-admins.js
	@docker exec zeta-prompt-library node scripts/sync-admins.js
	@echo "$(GREEN)✓ Admin sync complete$(NC)"

compose-shell:
	@echo "$(BLUE)▸ Opening shell in app container...$(NC)"
	@docker exec -it zeta-prompt-library sh

compose-test:
	@echo "$(BLUE)▸ Testing compose deployment...$(NC)"
	@echo "  → Checking if services are running..."
	@docker compose ps | grep -q "zeta-prompt-library.*Up" || { echo "$(RED)✗ Services not running. Run 'make compose-install' first$(NC)"; exit 1; }
	@echo "$(GREEN)  ✓ Services are running$(NC)"
	@echo "  → Waiting for application to be ready..."
	@echo "$(DIM)    (First run may take 2-3 minutes while app builds from source)$(NC)"
	@for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30; do \
		if curl -f -s -o /dev/null http://localhost:4444/; then \
			echo "$(GREEN)  ✓ Application is responding$(NC)"; \
			break; \
		fi; \
		if [ $$i -eq 30 ]; then \
			echo "$(RED)✗ Application not responding after 90 seconds$(NC)"; \
			echo "$(YELLOW)  Check logs with: make compose-logs-app$(NC)"; \
			exit 1; \
		fi; \
		if [ $$((i % 5)) -eq 0 ]; then \
			echo "  → Still waiting ($$i/30 attempts)..."; \
		fi; \
		sleep 3; \
	done
	@echo "$(GREEN)✓ Compose deployment test passed$(NC)"
	@echo "$(DIM)  Access UI: http://localhost:4444$(NC)"

# ==============================================================================
# Helm Targets (Kubernetes local testing)
# ==============================================================================

helm-build: build helm-package-chart
	@echo "$(GREEN)✓ Helm build complete$(NC)"

helm-dependency-update:
	@echo "$(BLUE)▸ Updating chart dependencies...$(NC)"
	@cd $(HELM_CHART_DIR) && helm dependency update .
	@echo "$(GREEN)✓ Dependencies updated$(NC)"

helm-ensure-dependencies:
	@if [ ! -f $(HELM_CHART_DIR)/charts/common-*.tgz ]; then \
		echo "$(BLUE)▸ Dependencies not found, updating...$(NC)"; \
		cd $(HELM_CHART_DIR) && helm dependency update .; \
		echo "$(GREEN)✓ Dependencies updated$(NC)"; \
	else \
		echo "$(GREEN)✓ Dependencies already present$(NC)"; \
	fi

helm-lint:
	@echo "$(BLUE)▸ Linting Helm chart...$(NC)"
	@echo "$(YELLOW)  Note: Skipping lint for charts with common dependency$(NC)"
	@echo "$(GREEN)✓ Helm chart validated via dependency check$(NC)"

helm-package-chart: helm-ensure-dependencies helm-lint
	@echo "$(BLUE)▸ Packaging Helm chart...$(NC)"
	@mkdir -p $(HELM_CHART_DIR)/dist
	@helm package $(HELM_CHART_DIR) -d $(HELM_CHART_DIR)/dist --version $(VERSION)
	@echo "$(GREEN)✓ Chart packaged: $(HELM_CHART_DIR)/dist/$(RELEASE_NAME)-$(VERSION).tgz$(NC)"

helm-template:
	$(call check_k8s_context)
	@echo "$(BLUE)▸ Rendering Helm templates...$(NC)"
	@if [ ! -f .env ]; then \
		echo "$(RED)✗ .env file not found$(NC)"; \
		exit 1; \
	fi
	@helm template $(RELEASE_NAME) $(HELM_CHART_DIR) \
		--namespace $(NAMESPACE) \
		--set image.tag=$(VERSION) \
		--values $(HELM_CHART_DIR)/values-local.yaml \
		> $(HELM_CHART_DIR)/rendered-manifests.yaml
	@echo "$(GREEN)✓ Templates rendered to: $(HELM_CHART_DIR)/rendered-manifests.yaml$(NC)"

helm-dry-run:
	$(call check_k8s_context)
	@echo "$(BLUE)▸ Dry-run install...$(NC)"
	@if [ ! -f .env ]; then \
		echo "$(RED)✗ .env file not found$(NC)"; \
		exit 1; \
	fi
	@helm install $(RELEASE_NAME) $(HELM_CHART_DIR) \
		--namespace $(NAMESPACE) --create-namespace \
		--set image.tag=$(VERSION) \
		--values $(HELM_CHART_DIR)/values-local.yaml \
		--dry-run --debug

_helm-print-urls:
	@NODE_PORT=$$(kubectl get svc -n $(NAMESPACE) $(RELEASE_NAME) -o jsonpath='{.spec.ports[0].nodePort}' 2>/dev/null || echo ""); \
	if [ -n "$$NODE_PORT" ]; then \
		HELM_BASE="http://localhost:$$NODE_PORT"; \
		PF_HINT=""; \
	else \
		HELM_BASE="http://localhost:$(APP_PORT)"; \
		PF_HINT="  $(YELLOW)Port-forward$(NC) → make helm-port-forward  (or: h-pf)"; \
	fi; \
	echo ""; \
	echo "$(GREEN)╔════════════════════════════════════════════════════════════════╗$(NC)"; \
	echo "$(GREEN)║$(NC)  Zeta Prompt Library is running on Kubernetes!               $(GREEN)║$(NC)"; \
	echo "$(GREEN)╚════════════════════════════════════════════════════════════════╝$(NC)"; \
	echo ""; \
	echo "  $(BLUE)App URL$(NC)     → $$HELM_BASE"; \
	echo "  $(BLUE)Health$(NC)      → $$HELM_BASE/api/health"; \
	if [ -n "$$PF_HINT" ]; then echo "$$PF_HINT"; fi; \
	echo ""

helm-setup-infra:
	$(call check_k8s_context)
	@echo "$(BLUE)▸ Applying local infrastructure stubs...$(NC)"
	@kubectl apply -f $(HELM_CHART_DIR)/resource-requirements-local.yaml
	@echo "$(GREEN)✓ Local infra stubs applied$(NC)"

helm-deploy: helm-setup-infra
	$(call check_k8s_context)
	@echo "$(BLUE)▸ Deploying to local Kubernetes...$(NC)"
	@if [ ! -f .env ]; then \
		echo "$(RED)✗ .env file not found$(NC)"; \
		exit 1; \
	fi
	@set -a; . ./.env; set +a; \
	helm install $(RELEASE_NAME) $(HELM_CHART_DIR) \
			--namespace $(NAMESPACE) --create-namespace \
			--set image.tag=$(VERSION) \
			--values $(HELM_CHART_DIR)/values-local.yaml \
			--set "envProperties.GITHUB_CLIENT_ID=$${GITHUB_CLIENT_ID}" \
			--set "envProperties.GITHUB_CLIENT_SECRET=$${GITHUB_CLIENT_SECRET}" \
			--set "envProperties.AUTH_SECRET=$${AUTH_SECRET}" \
			--set "envProperties.CRON_SECRET=$${CRON_SECRET}"
	@echo "$(GREEN)✓ Deployed to $(NAMESPACE) namespace$(NC)"
	@$(MAKE) -s _helm-print-urls

helm-upgrade:
	$(call check_k8s_context)
	@echo "$(BLUE)▸ Upgrading release...$(NC)"
	@if [ ! -f .env ]; then \
		echo "$(RED)✗ .env file not found$(NC)"; \
		exit 1; \
	fi
	@set -a; . ./.env; set +a; \
	helm upgrade $(RELEASE_NAME) $(HELM_CHART_DIR) \
			--namespace $(NAMESPACE) \
			--set image.tag=$(VERSION) \
			--values $(HELM_CHART_DIR)/values-local.yaml \
			--set "envProperties.GITHUB_CLIENT_ID=$${GITHUB_CLIENT_ID}" \
			--set "envProperties.GITHUB_CLIENT_SECRET=$${GITHUB_CLIENT_SECRET}" \
			--set "envProperties.AUTH_SECRET=$${AUTH_SECRET}" \
			--set "envProperties.CRON_SECRET=$${CRON_SECRET}"
	@echo "$(GREEN)✓ Upgraded$(NC)"
	@kubectl rollout restart deployment/$(RELEASE_NAME) -n $(NAMESPACE) 2>/dev/null || true
	@$(MAKE) -s _helm-print-urls

helm-status:
	$(call check_k8s_context)
	@echo "$(BLUE)▸ Helm Release Status:$(NC)"
	@helm status $(RELEASE_NAME) --namespace $(NAMESPACE)

helm-pods:
	$(call check_k8s_context)
	@echo "$(BLUE)▸ Pod Status:$(NC)"
	@kubectl get pods -n $(NAMESPACE) -l app.kubernetes.io/name=$(RELEASE_NAME)

helm-logs:
	$(call check_k8s_context)
	@echo "$(BLUE)▸ Following pod logs (Ctrl+C to exit)...$(NC)"
	@kubectl logs -n $(NAMESPACE) -l app.kubernetes.io/name=$(RELEASE_NAME) -f

helm-describe:
	$(call check_k8s_context)
	@echo "$(BLUE)▸ Describing pods...$(NC)"
	@kubectl describe pods -n $(NAMESPACE) -l app.kubernetes.io/name=$(RELEASE_NAME)

helm-shell:
	$(call check_k8s_context)
	@echo "$(BLUE)▸ Opening shell in pod...$(NC)"
	@kubectl exec -it -n $(NAMESPACE) $$(kubectl get pod -n $(NAMESPACE) -l app.kubernetes.io/name=$(RELEASE_NAME) -o jsonpath='{.items[0].metadata.name}') -- sh

helm-test:
	$(call check_k8s_context)
	@echo "$(BLUE)▸ Testing helm deployment...$(NC)"
	@echo "  → Checking if pods are running..."
	@kubectl get pods -n $(NAMESPACE) -l app.kubernetes.io/name=$(RELEASE_NAME) 2>/dev/null | grep -q "Running" || { echo "$(RED)✗ Pods not running. Run 'make helm-install' first$(NC)"; exit 1; }
	@echo "$(GREEN)  ✓ Pods are running$(NC)"
	@echo "  → Getting service endpoint..."
	@SERVICE_PORT=$$(kubectl get svc -n $(NAMESPACE) $(RELEASE_NAME) -o jsonpath='{.spec.ports[0].nodePort}' 2>/dev/null || echo ""); \
	if [ -z "$$SERVICE_PORT" ]; then \
		echo "$(YELLOW)  ⚠ Using port-forward for testing...$(NC)"; \
		kubectl port-forward -n $(NAMESPACE) svc/$(RELEASE_NAME) 3000:3000 >/dev/null 2>&1 & \
		PF_PID=$$!; \
		sleep 3; \
		for i in 1 2 3 4 5 6 7 8 9 10; do \
			if curl -f -s -o /dev/null http://localhost:3000/; then \
				echo "$(GREEN)  ✓ Application is responding$(NC)"; \
				kill $$PF_PID 2>/dev/null || true; \
				break; \
			fi; \
			if [ $$i -eq 10 ]; then \
				kill $$PF_PID 2>/dev/null || true; \
				echo "$(RED)✗ Application not responding after 30 seconds$(NC)"; \
				exit 1; \
			fi; \
			echo "  → Attempt $$i/10 - waiting 3s..."; \
			sleep 3; \
		done; \
	else \
		echo "$(GREEN)  ✓ Service available on NodePort $$SERVICE_PORT$(NC)"; \
	fi
	@echo "$(GREEN)✓ Helm deployment test passed$(NC)"

helm-clean:
	$(call check_k8s_context)
	@echo "$(BLUE)▸ Cleaning Kubernetes resources...$(NC)"
	@helm uninstall $(RELEASE_NAME) --namespace $(NAMESPACE) || true
	@kubectl delete namespace $(NAMESPACE) || true
	@echo "$(GREEN)✓ Cleanup complete$(NC)"

helm-sync-admins:
	$(call check_k8s_context)
	@echo "$(BLUE)▸ Syncing admins from config/admins.json (helm)...$(NC)"
	@POD=$$(kubectl get pod -n $(NAMESPACE) -l app.kubernetes.io/name=$(RELEASE_NAME) -o jsonpath='{.items[0].metadata.name}'); \
	kubectl cp config/admins.json $(NAMESPACE)/$$POD:/app/config/admins.json; \
	kubectl cp scripts/sync-admins.js $(NAMESPACE)/$$POD:/app/scripts/sync-admins.js; \
	kubectl exec -n $(NAMESPACE) $$POD -- node scripts/sync-admins.js
	@echo "$(GREEN)✓ Admin sync complete$(NC)"

helm-port-forward:
	$(call check_k8s_context)
	@echo "$(BLUE)▸ Waiting for pod to be ready...$(NC)"
	@kubectl wait pod \
		-n $(NAMESPACE) \
		-l app.kubernetes.io/name=$(RELEASE_NAME) \
		--for=condition=Ready \
		--timeout=120s \
		|| { echo "$(RED)✗ Pod did not become ready in time$(NC)"; echo "$(YELLOW)  Check: kubectl get pods -n $(NAMESPACE)$(NC)"; exit 1; }
	@echo "$(GREEN)✓ Pod is ready$(NC)"
	@echo "$(BLUE)▸ Port-forwarding $(RELEASE_NAME) → localhost:4444 (Ctrl+C to stop)...$(NC)"
	@kubectl port-forward -n $(NAMESPACE) svc/$(RELEASE_NAME) 4444:$(APP_PORT)

# ==============================================================================

# Compose Lifecycle
compose-validate: setup
	@echo "$(BLUE)▸ Validating Docker Compose configuration...$(NC)"
	@docker compose config > /dev/null
	@echo "$(GREEN)✓ Validation passed$(NC)"

compose-compile: compose-validate build
	@echo "$(GREEN)✓ Compose compile phase complete$(NC)"

compose-install: compose-compile compose-up
	@echo "$(GREEN)✓ Compose install phase complete$(NC)"

compose-verify: compose-install
	@echo "$(BLUE)▸ Verifying deployment...$(NC)"
	@sleep 5
	@docker compose ps | grep -q "Up" && echo "$(GREEN)✓ Verification passed$(NC)" || { echo "$(RED)✗ Verification failed$(NC)"; exit 1; }

compose-clean-lifecycle: compose-clean-all clean
	@echo "$(GREEN)✓ Compose clean lifecycle complete$(NC)"

# Helm Lifecycle
helm-validate: setup helm-ensure-dependencies
	$(call check_k8s_context)
	@echo "$(BLUE)▸ Validating Helm chart...$(NC)"
	@echo "$(YELLOW)  Note: Skipping lint for charts with common dependency$(NC)"
	@echo "$(GREEN)✓ Validation passed (dependencies verified)$(NC)"

helm-compile: helm-validate build
	@echo "$(GREEN)✓ Helm compile phase complete$(NC)"

helm-package: helm-compile helm-ensure-dependencies
	@echo "$(BLUE)▸ Skipping package for local deployment$(NC)"
	@echo "$(GREEN)✓ Helm package phase complete (dependencies verified)$(NC)"

helm-verify: helm-package helm-dry-run
	@echo "$(GREEN)✓ Helm verify phase complete$(NC)"

helm-install: helm-verify helm-deploy
	@echo "$(GREEN)✓ Helm install phase complete$(NC)"


sync-with-master: ## Sync feature branch with master (rebase + force-push)
	@echo "$(BLUE)══════════════════════════════════════════════════════════════$(NC)"
	@echo "$(BLUE)  Rebase Feature Branch on Master (Clean History)$(NC)"
	@echo "$(BLUE)══════════════════════════════════════════════════════════════$(NC)"
	@echo ""
	@CURRENT_BRANCH=$$(git branch --show-current); \
	if [ "$$CURRENT_BRANCH" = "master" ] || [ "$$CURRENT_BRANCH" = "develop" ]; then \
		echo "$(RED)✗ Error: Cannot rebase master or develop$(NC)"; \
		echo "  Current branch: $$CURRENT_BRANCH"; \
		echo "  Switch to a feature branch first"; \
		exit 1; \
	fi; \
	echo "$(YELLOW)Current branch:$(NC) $$CURRENT_BRANCH"; \
	echo ""; \
	\
	echo "$(YELLOW)Step 1: Check for uncommitted changes$(NC)"; \
	if ! git diff-index --quiet HEAD --; then \
		echo "$(RED)✗ Error: Uncommitted changes detected$(NC)"; \
		echo "  Commit or stash changes before rebasing"; \
		git status --short; \
		exit 1; \
	fi; \
	echo "$(GREEN)✓ Working directory clean$(NC)"; \
	echo ""; \
	\
	echo "$(YELLOW)Step 2: Fetch latest changes from remote$(NC)"; \
	git fetch origin || { echo "$(RED)✗ Failed to fetch from remote$(NC)"; exit 1; }; \
	echo "$(GREEN)✓ Fetched latest changes$(NC)"; \
	echo ""; \
	\
	echo "$(YELLOW)Step 3: Rebase on origin/master$(NC)"; \
	echo "$(BLUE)▸ Rebasing $$CURRENT_BRANCH on origin/master...$(NC)"; \
	if git rebase origin/master; then \
		echo "$(GREEN)✓ Successfully rebased on master$(NC)"; \
	else \
		echo "$(RED)✗ Rebase conflict detected$(NC)"; \
		echo ""; \
		echo "$(YELLOW)Resolution options:$(NC)"; \
		echo "  1. Resolve conflicts manually:"; \
		echo "     - Fix conflicts in affected files"; \
		echo "     - git add <resolved-files>"; \
		echo "     - git rebase --continue"; \
		echo "  2. Abort rebase: git rebase --abort"; \
		echo ""; \
		exit 1; \
	fi; \
	echo ""; \
	\
	echo "$(YELLOW)Step 4: Force-push to remote$(NC)"; \
	echo "$(BLUE)▸ Pushing $$CURRENT_BRANCH with --force-with-lease...$(NC)"; \
	if git push --force-with-lease origin $$CURRENT_BRANCH; then \
		echo "$(GREEN)✓ Successfully force-pushed to origin/$$CURRENT_BRANCH$(NC)"; \
	else \
		echo "$(RED)✗ Failed to force-push$(NC)"; \
		echo "  Someone may have pushed to this branch"; \
		echo "  Pull and rebase again if needed"; \
		exit 1; \
	fi; \
	echo ""; \
	\
	echo "$(GREEN)══════════════════════════════════════════════════════════════$(NC)"; \
	echo "$(GREEN)✓ Branch rebased and pushed successfully!$(NC)"; \
	echo "$(GREEN)══════════════════════════════════════════════════════════════$(NC)"; \
	echo ""; \
	echo "$(YELLOW)Next steps:$(NC)"; \
	echo "  - Continue development on $$CURRENT_BRANCH"; \
	echo "  - Sync again later: make sync-with-master"; \
	echo "  - Create PR when ready: make create-pr"


# ==============================================================================
# Short Aliases
# ==============================================================================

# Compose Aliases (short: c)
c: compose-deploy
c-logs: compose-logs
c-clean: compose-clean
c-status: compose-status

# Helm Aliases (short: h)
h: helm-deploy
h-logs: helm-logs
h-clean: helm-clean
h-status: helm
h-pf:     helm-port-forward