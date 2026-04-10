/**
 * Gateway WebSocket Server — Live Execution Streaming with Backpressure
 *
 * Provides real-time streaming of execution events to connected clients.
 * Uses RFC 6455 WebSocket framing with per-client backpressure tracking.
 *
 * Protocol:
 *   Client sends:   { type: 'subscribe', sessionId: string }
 *                   { type: 'subscribe', channel: string }
 *                   { type: 'unsubscribe', sessionId: string }
 *                   { type: 'unsubscribe', channel: string }
 *   Server sends:   StreamEvent JSON
 *
 * Backpressure:
 *   - Each client has a writableLength threshold (1 MB).
 *   - Clients exceeding threshold for 3 consecutive ticks are disconnected.
 *   - Per-client ring buffer (64 slots) for messages during backpressure.
 *   - Overflow of ring buffer → disconnect.
 *
 * Connect: ws://localhost:3000/ws
 *
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */

import { createHash } from 'node:crypto';
import type http from 'node:http';
import type { Duplex } from 'node:stream';

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

const BACKPRESSURE_THRESHOLD_BYTES = 1_048_576; // 1 MB
const SLOW_TICKS_BEFORE_DISCONNECT = 3;
const RING_BUFFER_SIZE = 64;
const STALL_TIMEOUT_MS = 2_000;

interface WSClient {
    socket: Duplex;
    /** Legacy session-ID subscriptions (kept for backwards compatibility) */
    subscriptions: Set<string>;
    /** New channel-based subscriptions (agents, chat:<id>, execution:<id>) */
    channels: Set<string>;
    alive: boolean;
    /** Number of consecutive ticks where writableLength exceeded threshold */
    slowTicks: number;
    /** Buffered messages when socket is draining */
    pendingBuffer: string[];
    /** Total messages dropped for this client */
    droppedCount: number;
    /** Last time the socket drained below threshold */
    lastDrainAt: number;
    connectedAt: number;
}

type BroadcastEvent = {
    type: string;
    sessionId: string;
    timestamp: string;
    data: Record<string, unknown>;
};

// ---------------------------------------------------------------------------
// WebSocket Server State
// ---------------------------------------------------------------------------

const clients = new Set<WSClient>();
let totalDroppedMessages = 0;
let totalDisconnectedForSlow = 0;

/**
 * Attach WebSocket handling to an existing HTTP server.
 */
export function attachWebSocket(server: http.Server): void {
    server.on('upgrade', (req: http.IncomingMessage, socket: Duplex, head: Buffer) => {
        const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
        if (url.pathname !== '/ws') {
            socket.destroy();
            return;
        }

        const key = req.headers['sec-websocket-key'];
        if (!key) {
            socket.destroy();
            return;
        }

        // Compute accept key per RFC 6455
        const MAGIC = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
        const accept = createHash('sha1')
            .update(key + MAGIC)
            .digest('base64');

        socket.write(
            'HTTP/1.1 101 Switching Protocols\r\n' +
            'Upgrade: websocket\r\n' +
            'Connection: Upgrade\r\n' +
            `Sec-WebSocket-Accept: ${accept}\r\n` +
            '\r\n',
        );

        const now = Date.now();
        const client: WSClient = {
            socket,
            subscriptions: new Set(),
            channels: new Set(),
            alive: true,
            slowTicks: 0,
            pendingBuffer: [],
            droppedCount: 0,
            lastDrainAt: now,
            connectedAt: now,
        };
        clients.add(client);

        // When socket drains, try to flush the ring buffer
        socket.on('drain', () => {
            client.lastDrainAt = Date.now();
            client.slowTicks = 0;
            flushPending(client);
        });

        socket.on('data', (buf: Buffer) => {
            const parsed = decodeFrame(buf);
            if (!parsed) return;

            if (parsed.opcode === 0x8) {
                // Close frame
                removeClient(client);
                return;
            }

            if (parsed.opcode === 0xa) {
                // Pong
                client.alive = true;
                return;
            }

            if (parsed.opcode === 0x1) {
                // Text frame
                try {
                    const msg = JSON.parse(parsed.payload) as {
                        type: string;
                        sessionId?: string;
                        channel?: string;
                    };
                    if (msg.type === 'subscribe') {
                        if (msg.sessionId) client.subscriptions.add(msg.sessionId);
                        if (msg.channel) client.channels.add(msg.channel);
                    } else if (msg.type === 'unsubscribe') {
                        if (msg.sessionId) client.subscriptions.delete(msg.sessionId);
                        if (msg.channel) client.channels.delete(msg.channel);
                    }
                } catch {
                    // Ignore malformed messages
                }
            }
        });

        socket.on('close', () => removeClient(client));
        socket.on('error', () => removeClient(client));
    });

    // Heartbeat + backpressure sweep every 1s (faster than old 30s heartbeat
    // because backpressure checks want sub-second reaction).
    setInterval(() => {
        const now = Date.now();
        for (const client of clients) {
            const buffered = (client.socket as any).writableLength ?? 0;

            // Check backpressure threshold
            if (buffered > BACKPRESSURE_THRESHOLD_BYTES) {
                client.slowTicks++;
                if (client.slowTicks >= SLOW_TICKS_BEFORE_DISCONNECT) {
                    console.warn(`[ws] disconnecting slow client (buffered ${buffered}b, ${client.slowTicks} slow ticks)`);
                    totalDisconnectedForSlow++;
                    removeClient(client);
                    continue;
                }
            } else {
                client.slowTicks = 0;
            }

            // Stall timeout: buffer isn't draining
            if (client.pendingBuffer.length > 0 && (now - client.lastDrainAt) > STALL_TIMEOUT_MS) {
                console.warn(`[ws] disconnecting stalled client (${client.pendingBuffer.length} pending, ${now - client.lastDrainAt}ms since drain)`);
                totalDisconnectedForSlow++;
                removeClient(client);
                continue;
            }
        }
    }, 1_000).unref();

    // Separate slower heartbeat (15s) for ping/pong liveness
    setInterval(() => {
        for (const client of clients) {
            if (!client.alive) {
                removeClient(client);
                continue;
            }
            client.alive = false;
            // Send ping
            try {
                client.socket.write(encodeFrame(0x9, ''));
            } catch {
                removeClient(client);
            }
        }
    }, 15_000).unref();
}

// ---------------------------------------------------------------------------
// Writing & Backpressure Handling
// ---------------------------------------------------------------------------

/** Try to flush pending messages from the per-client ring buffer. */
function flushPending(client: WSClient): void {
    while (client.pendingBuffer.length > 0) {
        const msg = client.pendingBuffer.shift()!;
        const canWrite = client.socket.writable && !(client.socket as any).writableNeedDrain;
        if (!canWrite) {
            // Put it back; we'll flush again on next drain
            client.pendingBuffer.unshift(msg);
            return;
        }
        try {
            client.socket.write(encodeFrame(0x1, msg));
        } catch {
            removeClient(client);
            return;
        }
    }
}

/** Write a message to a client with backpressure handling. */
function writeToClient(client: WSClient, payload: string): void {
    // If the socket needs draining, enqueue to the ring buffer instead
    const needDrain = (client.socket as any).writableNeedDrain === true;
    if (needDrain) {
        if (client.pendingBuffer.length >= RING_BUFFER_SIZE) {
            // Ring buffer overflow → drop oldest, increment dropped count
            client.pendingBuffer.shift();
            client.droppedCount++;
            totalDroppedMessages++;
            if (client.droppedCount > RING_BUFFER_SIZE * 2) {
                // Persistent overflow → disconnect
                removeClient(client);
                return;
            }
        }
        client.pendingBuffer.push(payload);
        return;
    }

    try {
        const ok = client.socket.write(encodeFrame(0x1, payload));
        if (!ok) {
            // Backpressure signal — next write should enqueue until drain
            client.lastDrainAt = Date.now();
        }
    } catch {
        removeClient(client);
    }
}

/**
 * Broadcast an event to all clients subscribed to the given sessionId or channel.
 * Backwards compatible: `sessionId` is still matched against both old subscriptions
 * and new channels.
 */
export function broadcastEvent(
    sessionId: string,
    type: string,
    data: Record<string, unknown> = {},
): void {
    const event: BroadcastEvent = {
        type,
        sessionId,
        timestamp: new Date().toISOString(),
        data,
    };
    const payload = JSON.stringify(event);

    for (const client of clients) {
        if (
            client.subscriptions.has(sessionId) ||
            client.subscriptions.has('*') ||
            client.channels.has(sessionId)
        ) {
            writeToClient(client, payload);
        }
    }
}

/**
 * Get count of connected WebSocket clients.
 */
export function getWSClientCount(): number {
    return clients.size;
}

/**
 * Get WebSocket server metrics.
 */
export function getWSMetrics(): {
    total: number;
    slow: number;
    totalDropped: number;
    totalDisconnectedForSlow: number;
    avgBufferedBytes: number;
    uptimeMs: number;
} {
    let slow = 0;
    let totalBuffered = 0;
    const now = Date.now();
    let oldestConnection = now;
    for (const c of clients) {
        if (c.slowTicks > 0) slow++;
        totalBuffered += (c.socket as any).writableLength ?? 0;
        if (c.connectedAt < oldestConnection) oldestConnection = c.connectedAt;
    }
    return {
        total: clients.size,
        slow,
        totalDropped: totalDroppedMessages,
        totalDisconnectedForSlow,
        avgBufferedBytes: clients.size > 0 ? Math.round(totalBuffered / clients.size) : 0,
        uptimeMs: clients.size > 0 ? now - oldestConnection : 0,
    };
}

// ---------------------------------------------------------------------------
// Helpers — Minimal RFC 6455 frame encode/decode
// ---------------------------------------------------------------------------

function removeClient(client: WSClient): void {
    clients.delete(client);
    try {
        client.socket.end();
    } catch {
        /* already closed */
    }
}

function encodeFrame(opcode: number, payload: string): Buffer {
    const data = Buffer.from(payload, 'utf-8');
    const len = data.length;

    let header: Buffer;
    if (len < 126) {
        header = Buffer.alloc(2);
        header[0] = 0x80 | opcode;
        header[1] = len;
    } else if (len < 65536) {
        header = Buffer.alloc(4);
        header[0] = 0x80 | opcode;
        header[1] = 126;
        header.writeUInt16BE(len, 2);
    } else {
        header = Buffer.alloc(10);
        header[0] = 0x80 | opcode;
        header[1] = 127;
        header.writeBigUInt64BE(BigInt(len), 2);
    }

    return Buffer.concat([header, data]);
}

function decodeFrame(
    buf: Buffer,
): { opcode: number; payload: string } | null {
    if (buf.length < 2) return null;

    const opcode = buf[0]! & 0x0f;
    const masked = !!(buf[1]! & 0x80);
    let payloadLen = buf[1]! & 0x7f;
    let offset = 2;

    if (payloadLen === 126) {
        if (buf.length < 4) return null;
        payloadLen = buf.readUInt16BE(2);
        offset = 4;
    } else if (payloadLen === 127) {
        if (buf.length < 10) return null;
        payloadLen = Number(buf.readBigUInt64BE(2));
        offset = 10;
    }

    let maskKey: Buffer | null = null;
    if (masked) {
        if (buf.length < offset + 4) return null;
        maskKey = buf.subarray(offset, offset + 4);
        offset += 4;
    }

    if (buf.length < offset + payloadLen) return null;

    const data = buf.subarray(offset, offset + payloadLen);

    if (maskKey) {
        for (let i = 0; i < data.length; i++) {
            data[i] = data[i]! ^ maskKey[i % 4]!;
        }
    }

    return { opcode, payload: data.toString('utf-8') };
}
