/**
 * Gateway WebSocket Server — Live Execution Streaming
 *
 * Provides real-time streaming of execution events to connected clients.
 * Uses Server-Sent Events (SSE) pattern over WebSocket for bi-directional communication.
 *
 * Protocol:
 *   Client sends:   { type: 'subscribe', sessionId: string }
 *   Client sends:   { type: 'unsubscribe', sessionId: string }
 *   Server sends:   StreamEvent JSON (phase.started, reasoning.step, tool.completed, etc.)
 *
 * Connect: ws://localhost:3000/ws
 */

import { createHash } from 'node:crypto';
import type http from 'node:http';
import type { Duplex } from 'node:stream';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WSClient {
    socket: Duplex;
    subscriptions: Set<string>;
    alive: boolean;
}

type BroadcastEvent = {
    type: string;
    sessionId: string;
    timestamp: string;
    data: Record<string, unknown>;
};

// ---------------------------------------------------------------------------
// WebSocket Server (RFC 6455, no external deps)
// ---------------------------------------------------------------------------

const clients = new Set<WSClient>();

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

        const client: WSClient = {
            socket,
            subscriptions: new Set(),
            alive: true,
        };
        clients.add(client);

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
                    };
                    if (msg.type === 'subscribe' && msg.sessionId) {
                        client.subscriptions.add(msg.sessionId);
                    } else if (msg.type === 'unsubscribe' && msg.sessionId) {
                        client.subscriptions.delete(msg.sessionId);
                    }
                } catch {
                    // Ignore malformed messages
                }
            }
        });

        socket.on('close', () => removeClient(client));
        socket.on('error', () => removeClient(client));
    });

    // Heartbeat every 30s
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
    }, 30_000).unref();
}

/**
 * Broadcast an event to all clients subscribed to the given sessionId.
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
        if (client.subscriptions.has(sessionId) || client.subscriptions.has('*')) {
            try {
                client.socket.write(encodeFrame(0x1, payload));
            } catch {
                removeClient(client);
            }
        }
    }
}

/**
 * Get count of connected WebSocket clients.
 */
export function getWSClientCount(): number {
    return clients.size;
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
