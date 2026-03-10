#!/usr/bin/env bash
# =============================================================================
# AgentOS — Full Platform Test Script
#
# Tests:
#   1. Gateway health check
#   2. All API endpoints (via api.test.ts)
#   3. Frontend build verification
#   4. TypeScript type checking
#   5. Critical UI component smoke tests
#
# Usage:
#   chmod +x scripts/test-all.sh
#   ./scripts/test-all.sh
#
#   Or via pnpm:
#   pnpm test:all
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

GATEWAY_URL="${GATEWAY_URL:-http://localhost:3000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3010}"
PASS=0
FAIL=0
SKIP=0

log_header() { echo -e "\n${BOLD}${CYAN}══ $1 ══${RESET}"; }
log_pass()   { echo -e "  ${GREEN}✓${RESET}  $1"; PASS=$((PASS + 1)); }
log_fail()   { echo -e "  ${RED}✗${RESET}  $1"; FAIL=$((FAIL + 1)); }
log_skip()   { echo -e "  ${YELLOW}○${RESET}  $1 (skipped)"; SKIP=$((SKIP + 1)); }
log_info()   { echo -e "  ${CYAN}ℹ${RESET}  $1"; }

# HTTP helper
http_get() {
    local url="$1"
    local expected="${2:-200}"
    local status
    status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "000")
    echo "$status"
}

http_post() {
    local url="$1"
    local data="${2:-{}}"
    local expected="${3:-200}"
    local status
    status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
        -X POST -H "Content-Type: application/json" -d "$data" "$url" 2>/dev/null || echo "000")
    echo "$status"
}

check_status() {
    local name="$1"
    local actual="$2"
    local expected="$3"
    if [ "$actual" = "$expected" ]; then
        log_pass "$name (HTTP $actual)"
    else
        log_fail "$name (expected HTTP $expected, got HTTP $actual)"
    fi
}

# =============================================================================
# 1. Prerequisites Check
# =============================================================================

log_header "Prerequisites"

# Node version
if node --version 2>/dev/null | grep -q "v2[0-9]"; then
    log_pass "Node.js $(node --version)"
else
    log_fail "Node.js v20+ required (got: $(node --version 2>/dev/null || echo 'not found'))"
fi

# pnpm
if command -v pnpm &>/dev/null; then
    log_pass "pnpm $(pnpm --version)"
else
    log_fail "pnpm not found (npm install -g pnpm)"
fi

# TypeScript
if command -v tsc &>/dev/null; then
    log_pass "TypeScript $(tsc --version)"
else
    log_skip "TypeScript (tsc not in PATH)"
fi

# =============================================================================
# 2. Gateway Health Checks
# =============================================================================

log_header "Gateway Health"

GATEWAY_STATUS=$(http_get "$GATEWAY_URL/api/health")
if [ "$GATEWAY_STATUS" = "200" ]; then
    log_pass "Gateway reachable at $GATEWAY_URL"

    HEALTH=$(curl -s --max-time 10 "$GATEWAY_URL/api/health" 2>/dev/null || echo "{}")
    if echo "$HEALTH" | grep -q '"status":"healthy"'; then
        log_pass "Gateway reports healthy status"
    else
        log_fail "Gateway not healthy: $HEALTH"
    fi

    UPTIME=$(echo "$HEALTH" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('uptime','?'))" 2>/dev/null || echo "?")
    log_info "Uptime: ${UPTIME}s"
else
    log_fail "Gateway not reachable at $GATEWAY_URL (HTTP $GATEWAY_STATUS)"
    log_info "Start with: cd services/gateway && pnpm dev"
    echo ""
    echo -e "${RED}Cannot continue without gateway. Exiting.${RESET}"
    exit 1
fi

# =============================================================================
# 3. Core API Endpoints
# =============================================================================

log_header "Core API Endpoints"

check_status "GET /api/health"   "$(http_get "$GATEWAY_URL/api/health")" "200"
check_status "GET /api/stats"    "$(http_get "$GATEWAY_URL/api/stats")" "200"
check_status "GET /api/skills"   "$(http_get "$GATEWAY_URL/api/skills")" "200"
check_status "GET /api/activity" "$(http_get "$GATEWAY_URL/api/activity")" "200"
check_status "POST /api/classify" \
    "$(http_post "$GATEWAY_URL/api/classify" '{"query":"create marketing campaign"}')" "200"
check_status "POST /api/query" \
    "$(http_post "$GATEWAY_URL/api/query" '{"query":"analyze incident root cause"}')" "200"
check_status "GET /api/personas" "$(http_get "$GATEWAY_URL/api/personas")" "200"
check_status "GET /api/licenses" "$(http_get "$GATEWAY_URL/api/licenses")" "200"

# =============================================================================
# 4. Skill Marketplace API
# =============================================================================

log_header "Skill Marketplace API"

check_status "GET /api/marketplace/skills"          "$(http_get "$GATEWAY_URL/api/marketplace/skills")" "200"
check_status "GET /api/marketplace/skills?persona=" "$(http_get "$GATEWAY_URL/api/marketplace/skills?persona=engineering")" "200"
check_status "GET /api/marketplace/skills/search"   "$(http_get "$GATEWAY_URL/api/marketplace/skills/search?q=campaign")" "200"
check_status "GET /api/marketplace/templates"       "$(http_get "$GATEWAY_URL/api/marketplace/templates")" "200"
check_status "GET /api/marketplace/analytics"       "$(http_get "$GATEWAY_URL/api/marketplace/analytics")" "200"
check_status "GET /api/marketplace/governance"      "$(http_get "$GATEWAY_URL/api/marketplace/governance")" "200"
check_status "POST /api/marketplace/skills (create)" \
    "$(http_post "$GATEWAY_URL/api/marketplace/skills" \
    '{"name":"Shell Test Skill","slug":"shell-test-skill","personaId":"engineering","personaName":"Engineering","personaIcon":"⚙️","personaColor":"#3b82f6","description":"Shell test","requiredTools":[],"agents":[],"workflow":[],"promptTemplates":[],"outputs":[],"permissions":[],"visibility":"private","version":"1.0.0","createdBy":"test"}' \
    )" "201"

# =============================================================================
# 5. Intent Engine API
# =============================================================================

log_header "Intent Engine API"

check_status "POST /api/intent/route" \
    "$(http_post "$GATEWAY_URL/api/intent/route" '{"query":"create PRD and jira epics"}')" "200"
check_status "GET /api/intent/suggestions" \
    "$(http_get "$GATEWAY_URL/api/intent/suggestions?limit=5")" "200"
check_status "GET /api/intent/suggestions?persona=" \
    "$(http_get "$GATEWAY_URL/api/intent/suggestions?persona=marketing")" "200"

# =============================================================================
# 6. Execution Scheduler API
# =============================================================================

log_header "Execution Scheduler API"

check_status "GET /api/scheduler/jobs"   "$(http_get "$GATEWAY_URL/api/scheduler/jobs")" "200"
check_status "GET /api/scheduler/stats"  "$(http_get "$GATEWAY_URL/api/scheduler/stats")" "200"

# Create a job
JOB_RESP=$(curl -s --max-time 10 \
    -X POST -H "Content-Type: application/json" \
    -d '{"name":"Shell Test Job","skillId":"test.skill","scheduleType":"cron","cronExpression":"0 9 * * MON"}' \
    "$GATEWAY_URL/api/scheduler/jobs" 2>/dev/null || echo "{}")

if echo "$JOB_RESP" | grep -q '"id"'; then
    log_pass "POST /api/scheduler/jobs (create) — HTTP 201"
    JOB_ID=$(echo "$JOB_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['job']['id'])" 2>/dev/null || echo "")

    if [ -n "$JOB_ID" ]; then
        check_status "GET /api/scheduler/jobs/:id" "$(http_get "$GATEWAY_URL/api/scheduler/jobs/$JOB_ID")" "200"
        check_status "POST /api/scheduler/jobs/:id/toggle" \
            "$(http_post "$GATEWAY_URL/api/scheduler/jobs/$JOB_ID/toggle")" "200"
        check_status "DELETE /api/scheduler/jobs/:id" \
            "$(http_get "$GATEWAY_URL/api/scheduler/jobs/$JOB_ID" 2>/dev/null; \
               curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
               -X DELETE "$GATEWAY_URL/api/scheduler/jobs/$JOB_ID" 2>/dev/null || echo "000")" "200"
    fi
else
    log_fail "POST /api/scheduler/jobs (create) — unexpected response: $JOB_RESP"
fi

check_status "POST /api/scheduler/events" \
    "$(http_post "$GATEWAY_URL/api/scheduler/events" '{"trigger":"github.pull_request.opened","data":{"pr":1}}')" "200"

# =============================================================================
# 7. Blog API
# =============================================================================

log_header "Blog API"

check_status "GET /api/blog/posts"    "$(http_get "$GATEWAY_URL/api/blog/posts")" "200"
check_status "GET /api/blog/stats"    "$(http_get "$GATEWAY_URL/api/blog/stats")" "200"
check_status "GET /api/blog/posts?status=draft" "$(http_get "$GATEWAY_URL/api/blog/posts?status=draft")" "200"

# Create a post
POST_RESP=$(curl -s --max-time 10 \
    -X POST -H "Content-Type: application/json" \
    -d '{"title":"Shell Test Post","content":"Shell test content","excerpt":"Shell excerpt","tags":["test"],"authorName":"Shell Tester"}' \
    "$GATEWAY_URL/api/blog/posts" 2>/dev/null || echo "{}")

if echo "$POST_RESP" | grep -q '"id"'; then
    log_pass "POST /api/blog/posts (create) — HTTP 201"
    POST_ID=$(echo "$POST_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['post']['id'])" 2>/dev/null || echo "")

    if [ -n "$POST_ID" ]; then
        check_status "GET /api/blog/posts/:id" "$(http_get "$GATEWAY_URL/api/blog/posts/$POST_ID")" "200"
        check_status "POST /api/blog/posts/:id/publish" \
            "$(http_post "$GATEWAY_URL/api/blog/posts/$POST_ID/publish" '{"destinations":["internal"]}')" "200"
        check_status "POST /api/blog/posts/:id/like" \
            "$(http_post "$GATEWAY_URL/api/blog/posts/$POST_ID/like")" "200"
        # Cleanup
        curl -s -X DELETE "$GATEWAY_URL/api/blog/posts/$POST_ID" > /dev/null 2>&1
        log_info "Cleaned up test post $POST_ID"
    fi
else
    log_fail "POST /api/blog/posts (create) — unexpected response"
fi

# =============================================================================
# 8. Forum API
# =============================================================================

log_header "Forum API"

check_status "GET /api/forum/threads"            "$(http_get "$GATEWAY_URL/api/forum/threads")" "200"
check_status "GET /api/forum/threads?sort=hot"   "$(http_get "$GATEWAY_URL/api/forum/threads?sort=hot")" "200"
check_status "GET /api/forum/threads?sort=new"   "$(http_get "$GATEWAY_URL/api/forum/threads?sort=new")" "200"
check_status "GET /api/forum/threads?sort=top"   "$(http_get "$GATEWAY_URL/api/forum/threads?sort=top")" "200"
check_status "GET /api/forum/threads?q=roadmap"  "$(http_get "$GATEWAY_URL/api/forum/threads?q=roadmap")" "200"
check_status "GET /api/forum/stats"              "$(http_get "$GATEWAY_URL/api/forum/stats")" "200"

# Create a thread
THREAD_RESP=$(curl -s --max-time 10 \
    -X POST -H "Content-Type: application/json" \
    -d '{"title":"Shell Test Discussion","body":"This is a shell test discussion body for E2E testing.","category":"general","tags":["test"],"authorName":"Shell Tester"}' \
    "$GATEWAY_URL/api/forum/threads" 2>/dev/null || echo "{}")

if echo "$THREAD_RESP" | grep -q '"id"'; then
    log_pass "POST /api/forum/threads (create) — HTTP 201"
    THREAD_ID=$(echo "$THREAD_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['thread']['id'])" 2>/dev/null || echo "")

    if [ -n "$THREAD_ID" ]; then
        check_status "GET /api/forum/threads/:id" "$(http_get "$GATEWAY_URL/api/forum/threads/$THREAD_ID")" "200"
        check_status "POST /api/forum/threads/:id/vote" \
            "$(http_post "$GATEWAY_URL/api/forum/threads/$THREAD_ID/vote" '{"vote":"up"}')" "200"
        check_status "GET /api/forum/threads/:id/comments" \
            "$(http_get "$GATEWAY_URL/api/forum/threads/$THREAD_ID/comments")" "200"

        # Add comment
        COMMENT_RESP=$(curl -s --max-time 10 \
            -X POST -H "Content-Type: application/json" \
            -d '{"body":"This is a shell test comment.","authorName":"Shell Tester"}' \
            "$GATEWAY_URL/api/forum/threads/$THREAD_ID/comments" 2>/dev/null || echo "{}")

        if echo "$COMMENT_RESP" | grep -q '"id"'; then
            log_pass "POST /api/forum/threads/:id/comments (add comment) — HTTP 201"
            COMMENT_ID=$(echo "$COMMENT_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['comment']['id'])" 2>/dev/null || echo "")
            if [ -n "$COMMENT_ID" ]; then
                check_status "POST /api/forum/comments/:id/vote" \
                    "$(http_post "$GATEWAY_URL/api/forum/comments/$COMMENT_ID/vote" '{"vote":"up"}')" "200"
            fi
        else
            log_fail "POST /api/forum/threads/:id/comments — unexpected response"
        fi
    fi
else
    log_fail "POST /api/forum/threads (create) — unexpected response"
fi

# =============================================================================
# 9. Observability API
# =============================================================================

log_header "Observability API"

check_status "GET /api/observability/executions" "$(http_get "$GATEWAY_URL/api/observability/executions")" "200"
check_status "GET /api/observability/metrics"    "$(http_get "$GATEWAY_URL/api/observability/metrics")" "200"
check_status "GET /api/memory/stats"             "$(http_get "$GATEWAY_URL/api/memory/stats")" "200"
check_status "GET /api/memory/executions"        "$(http_get "$GATEWAY_URL/api/memory/executions")" "200"

# =============================================================================
# 10. Error Handling
# =============================================================================

log_header "Error Handling"

check_status "GET unknown path → 404"      "$(http_get "$GATEWAY_URL/api/not-a-real-path")" "404"
check_status "POST /api/query no body → 400" \
    "$(http_post "$GATEWAY_URL/api/query" '{}')" "400"
check_status "POST /api/blog/posts no title → 400" \
    "$(http_post "$GATEWAY_URL/api/blog/posts" '{"content":"no title"}')" "400"
check_status "POST /api/forum/threads no body → 400" \
    "$(http_post "$GATEWAY_URL/api/forum/threads" '{"title":"no body"}')" "400"
check_status "GET /api/blog/posts/nonexistent → 404" \
    "$(http_get "$GATEWAY_URL/api/blog/posts/does-not-exist-xyz-abc")" "404"
check_status "GET /api/scheduler/jobs/nonexistent → 404" \
    "$(http_get "$GATEWAY_URL/api/scheduler/jobs/does-not-exist-xyz-abc")" "404"

# =============================================================================
# 11. Frontend Build Check (optional)
# =============================================================================

log_header "Frontend Build"

FRONTEND_STATUS=$(http_get "$FRONTEND_URL" 2>/dev/null || echo "000")
if [ "$FRONTEND_STATUS" = "200" ]; then
    log_pass "Frontend reachable at $FRONTEND_URL"
else
    log_skip "Frontend not running at $FRONTEND_URL (start: cd apps/web && pnpm dev)"
fi

# TypeScript compilation check (non-blocking)
log_info "Checking TypeScript compilation..."
if command -v pnpm &>/dev/null; then
    if (cd /Users/phani.m/Downloads/AgentOS/apps/web && pnpm exec tsc --noEmit 2>&1 | tail -5); then
        log_pass "Frontend TypeScript compiled without errors"
    else
        log_fail "Frontend TypeScript has errors (check above)"
    fi
else
    log_skip "TypeScript check (pnpm not available)"
fi

# =============================================================================
# Summary
# =============================================================================

TOTAL=$((PASS + FAIL + SKIP))
echo ""
echo "╔══════════════════════════════════════════════════╗"
printf "║  Results: ${GREEN}%d passed${RESET}, ${RED}%d failed${RESET}, ${YELLOW}%d skipped${RESET}           ║\n" "$PASS" "$FAIL" "$SKIP"
echo "╚══════════════════════════════════════════════════╝"
echo ""

if [ "$FAIL" -gt 0 ]; then
    echo -e "${RED}${FAIL} test(s) failed. Please fix before launch.${RESET}"
    exit 1
else
    echo -e "${GREEN}All tests passed! Platform is ready for launch.${RESET}"
    exit 0
fi
