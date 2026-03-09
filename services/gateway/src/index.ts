/**
 * @agentos/gateway — API Gateway Service
 *
 * REST + WebSocket entry point for external clients and internal services.
 * Handles authentication, rate limiting, and routing to the orchestrator.
 *
 * This is a service stub — implement the TODO sections to build the API.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GatewayConfig {
    port: number;
    corsOrigins: string[];
    rateLimiting: {
        maxRequestsPerMinute: number;
        maxRequestsPerHour: number;
    };
    auth: {
        apiKeyHeader: string;
        jwtSecret?: string;
    };
    websocket: {
        enabled: boolean;
        heartbeatIntervalMs: number;
    };
}

const defaultConfig: GatewayConfig = {
    port: 3000,
    corsOrigins: ['*'],
    rateLimiting: {
        maxRequestsPerMinute: 60,
        maxRequestsPerHour: 1000,
    },
    auth: {
        apiKeyHeader: 'x-api-key',
    },
    websocket: {
        enabled: true,
        heartbeatIntervalMs: 30_000,
    },
};

// ---------------------------------------------------------------------------
// Gateway Service
// ---------------------------------------------------------------------------

class Gateway {
    private config: GatewayConfig;

    constructor(config: Partial<GatewayConfig> = {}) {
        this.config = { ...defaultConfig, ...config };
    }

    async start(): Promise<void> {
        console.log(`🌐 Gateway starting on port ${this.config.port}...`);

        // TODO: Set up HTTP server (express / fastify / hono)
        // TODO: Configure CORS
        // TODO: Set up authentication middleware
        // TODO: Set up rate limiting middleware
        // TODO: Register REST routes
        // TODO: Set up WebSocket server for real-time streaming
        // TODO: Connect to orchestrator

        console.log('🌐 Gateway ready');
        console.log(`   REST:      http://localhost:${this.config.port}/api`);
        console.log(`   WebSocket: ws://localhost:${this.config.port}/ws`);
        console.log(`   Health:    http://localhost:${this.config.port}/health`);
    }

    async stop(): Promise<void> {
        console.log('🌐 Gateway shutting down...');
        // TODO: Close HTTP server
        // TODO: Close WebSocket connections
    }
}

// ---------------------------------------------------------------------------
// Routes (to be implemented)
// ---------------------------------------------------------------------------

/**
 * REST API Routes:
 *
 * POST   /api/goals              — Submit a goal
 * GET    /api/goals/:id          — Get goal status
 * DELETE /api/goals/:id          — Cancel a goal
 * GET    /api/goals/:id/replay   — Replay a goal execution
 *
 * GET    /api/workers             — List workers
 * GET    /api/workers/:id         — Get worker status
 *
 * GET    /api/workflows           — List workflows
 * POST   /api/workflows/:id/run  — Trigger a workflow
 *
 * GET    /api/policies            — List policies
 * POST   /api/policies            — Create a policy
 *
 * GET    /api/audit               — Query audit trail
 *
 * GET    /api/memory/search       — Search vector memory
 *
 * GET    /health                  — Health check
 * GET    /metrics                 — Prometheus metrics
 */

// ---------------------------------------------------------------------------
// WebSocket Events (to be implemented)
// ---------------------------------------------------------------------------

/**
 * WebSocket Messages (Server → Client):
 *
 * task.started     — A task began execution
 * task.completed   — A task finished
 * task.failed      — A task failed
 * worker.status    — Worker status change
 * approval.needed  — Human approval required
 * goal.completed   — Full goal execution complete
 */

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const gateway = new Gateway();

gateway.start().catch((err) => {
    console.error('Failed to start gateway:', err);
    process.exit(1);
});

process.on('SIGTERM', () => gateway.stop());
process.on('SIGINT', () => gateway.stop());

export { Gateway, GatewayConfig };
