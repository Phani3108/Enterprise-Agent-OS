#!/usr/bin/env node

/**
 * eaos — EAOS Command Line Interface
 *
 * Usage:
 *   eaos up                    Start all services
 *   eaos down                  Stop all services
 *   eaos status                Show service status
 *   eaos logs [service]        Tail service logs
 *   eaos exec <goal>           Execute a goal
 *   eaos skills                List available skills
 *   eaos skills:test <id>      Test a skill
 *   eaos workers               List active workers
 *   eaos workflows             List workflows
 *   eaos capabilities          Show system capabilities
 *   eaos trace <id>            Show execution trace
 *   eaos health                Health check all services
 *   eaos config                Show configuration
 */

import { execSync, spawn } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../../..');
const DEPLOY = resolve(ROOT, 'deploy');

const GATEWAY_URL = process.env.GATEWAY_URL ?? 'http://localhost:3000';

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

const commands: Record<string, (args: string[]) => Promise<void>> = {
    up: async () => {
        console.log('🚀 Starting EAOS...\n');
        execSync('docker compose up -d', { cwd: DEPLOY, stdio: 'inherit' });
        console.log('\n✅ EAOS is running');
        console.log(`   Gateway:          ${GATEWAY_URL}`);
        console.log('   Grafana:          http://localhost:3003');
        console.log('   Prometheus:       http://localhost:9090');
        console.log('   NATS Monitor:     http://localhost:8222');
    },

    down: async () => {
        console.log('🛑 Stopping EAOS...');
        execSync('docker compose down', { cwd: DEPLOY, stdio: 'inherit' });
        console.log('✅ EAOS stopped');
    },

    status: async () => {
        console.log('📊 EAOS Service Status\n');
        const services = [
            { name: 'Gateway', port: 3000 },
            { name: 'Orchestrator', port: 3001 },
            { name: 'Memory', port: 3002 },
            { name: 'Skills Runtime', port: 3004 },
            { name: 'Cognitive Engine', port: 3005 },
            { name: 'Reliability', port: 3006 },
            { name: 'Learning Engine', port: 3007 },
        ];

        for (const svc of services) {
            try {
                const res = await fetch(`http://localhost:${svc.port}/health`);
                const status = res.ok ? '✅' : '⚠️';
                console.log(`  ${status}  ${svc.name.padEnd(20)} :${svc.port}  ${res.ok ? 'healthy' : res.status}`);
            } catch {
                console.log(`  ❌  ${svc.name.padEnd(20)} :${svc.port}  unreachable`);
            }
        }
    },

    logs: async (args) => {
        const service = args[0] ?? '';
        const cmd = service ? `docker compose logs -f ${service}` : 'docker compose logs -f';
        const proc = spawn('sh', ['-c', cmd], { cwd: DEPLOY, stdio: 'inherit' });
        proc.on('close', () => { });
    },

    exec: async (args) => {
        const goal = args.join(' ');
        if (!goal) {
            console.error('Usage: eaos exec <goal>');
            process.exit(1);
        }

        console.log(`🧠 Executing: "${goal}"\n`);

        try {
            const res = await fetch(`${GATEWAY_URL}/api/goals`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ goal, options: {} }),
            });

            const result = await res.json();

            console.log('📋 Result:');
            console.log(JSON.stringify(result, null, 2));
        } catch (err) {
            console.error('Failed to connect to EAOS Gateway:', (err as Error).message);
            console.error('Run `eaos up` first.');
        }
    },

    skills: async () => {
        console.log('🧩 Available Skills\n');
        try {
            const res = await fetch(`${GATEWAY_URL}/api/skills/domains`);
            const domains = await res.json();

            for (const [domain, skills] of Object.entries(domains as Record<string, unknown[]>)) {
                console.log(`  📂 ${domain}`);
                for (const skill of skills as Array<{ name: string; id: string }>) {
                    console.log(`     └─ ${skill.name} (${skill.id})`);
                }
                console.log();
            }
        } catch {
            console.log('  Could not connect to Skills Runtime. Run `eaos up` first.');
        }
    },

    workers: async () => {
        console.log('🤖 Active Workers\n');
        try {
            const res = await fetch(`${GATEWAY_URL}/api/workers`);
            const workers = await res.json() as Array<{ id: string; state: string; cluster: string }>;

            for (const w of workers) {
                const icon = w.state === 'executing' ? '🔄' : w.state === 'idle' ? '💤' : '⚡';
                console.log(`  ${icon}  ${w.id.padEnd(30)} ${w.state.padEnd(15)} ${w.cluster}`);
            }
        } catch {
            console.log('  Could not connect. Run `eaos up` first.');
        }
    },

    capabilities: async () => {
        console.log('🎯 EAOS Capabilities\n');
        try {
            const res = await fetch(`${GATEWAY_URL}/api/capabilities`);
            const caps = await res.json() as Record<string, Array<{ name: string; description: string }>>;

            for (const [domain, items] of Object.entries(caps)) {
                console.log(`  📋 ${domain}`);
                for (const item of items) {
                    console.log(`     • ${item.name} — ${item.description}`);
                }
                console.log();
            }
        } catch {
            console.log('  Could not connect. Run `eaos up` first.');
        }
    },

    trace: async (args) => {
        const traceId = args[0];
        if (!traceId) {
            console.error('Usage: eaos trace <execution-id>');
            process.exit(1);
        }

        try {
            const res = await fetch(`${GATEWAY_URL}/api/cognitive/trace/${traceId}`);
            const trace = await res.json();
            console.log(JSON.stringify(trace, null, 2));
        } catch {
            console.log('  Could not retrieve trace. Run `eaos up` first.');
        }
    },

    health: async () => {
        await commands.status([]);
    },

    config: async () => {
        console.log('⚙️  EAOS Configuration\n');
        console.log(`  Gateway:        ${GATEWAY_URL}`);
        console.log(`  Deploy dir:     ${DEPLOY}`);
        console.log(`  Root dir:       ${ROOT}`);
    },
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
    const [, , command, ...args] = process.argv;

    if (!command || command === '--help') {
        console.log(`
🧠 eaos — Enterprise Agent Operating System CLI

Commands:
  up                    Start all EAOS services
  down                  Stop all services
  status                Show service health
  logs [service]        Tail logs
  exec <goal>           Execute a goal through EAOS
  skills                List available skills
  workers               List active workers
  capabilities          Show system capabilities
  trace <id>            Inspect execution trace
  health                Health check
  config                Show configuration
`);
        return;
    }

    const handler = commands[command.replace(':', '_')];
    if (!handler) {
        console.error(`Unknown command: ${command}`);
        console.error('Run `eaos --help` for available commands.');
        process.exit(1);
    }

    await handler(args);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
