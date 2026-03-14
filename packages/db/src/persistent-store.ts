/**
 * Persistent Store — File-backed persistence layer for AgentOS
 *
 * Extends InMemoryStore with automatic JSON file persistence.
 * Zero external dependencies — uses only Node.js built-ins.
 * Data survives gateway restarts.
 *
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Store } from './connection.js';

// ---------------------------------------------------------------------------
// Persistent Store
// ---------------------------------------------------------------------------

export class PersistentStore implements Store {
    private tables: Map<string, Map<string, Record<string, unknown>>> = new Map();
    private filePath: string;
    private saveTimer: ReturnType<typeof setTimeout> | null = null;
    private dirty = false;

    constructor(dataDir?: string) {
        const dir = dataDir ?? join(process.cwd(), '.agentos-data');
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
        this.filePath = join(dir, 'store.json');
        this.load();
    }

    // -----------------------------------------------------------------------
    // Core Operations (same interface as InMemoryStore)
    // -----------------------------------------------------------------------

    getTable(name: string): Map<string, Record<string, unknown>> {
        if (!this.tables.has(name)) this.tables.set(name, new Map());
        return this.tables.get(name)!;
    }

    insert(table: string, id: string, data: Record<string, unknown>): void {
        this.getTable(table).set(id, { ...data, id });
        this.scheduleSave();
    }

    get(table: string, id: string): Record<string, unknown> | undefined {
        return this.getTable(table).get(id);
    }

    update(table: string, id: string, data: Partial<Record<string, unknown>>): void {
        const existing = this.getTable(table).get(id);
        if (existing) {
            this.getTable(table).set(id, { ...existing, ...data });
            this.scheduleSave();
        }
    }

    delete(table: string, id: string): void {
        this.getTable(table).delete(id);
        this.scheduleSave();
    }

    query(table: string, filter: (row: Record<string, unknown>) => boolean): Record<string, unknown>[] {
        return [...this.getTable(table).values()].filter(filter);
    }

    all(table: string): Record<string, unknown>[] {
        return [...this.getTable(table).values()];
    }

    // -----------------------------------------------------------------------
    // Persistence
    // -----------------------------------------------------------------------

    private load(): void {
        if (!existsSync(this.filePath)) {
            console.log(`💾 No existing data file at ${this.filePath} — starting fresh`);
            return;
        }

        try {
            const raw = readFileSync(this.filePath, 'utf-8');
            const data = JSON.parse(raw) as Record<string, Record<string, Record<string, unknown>>>;

            for (const [tableName, rows] of Object.entries(data)) {
                const table = new Map<string, Record<string, unknown>>();
                for (const [id, row] of Object.entries(rows)) {
                    table.set(id, row);
                }
                this.tables.set(tableName, table);
            }

            const totalRows = [...this.tables.values()].reduce((n, t) => n + t.size, 0);
            console.log(`💾 Loaded ${totalRows} records from ${this.tables.size} tables`);
        } catch (err) {
            console.error(`💾 Failed to load data file: ${err}`);
        }
    }

    private scheduleSave(): void {
        this.dirty = true;
        if (this.saveTimer) return;

        // Debounce saves — flush within 500ms
        this.saveTimer = setTimeout(() => {
            this.saveTimer = null;
            if (this.dirty) this.save();
        }, 500);
    }

    save(): void {
        const data: Record<string, Record<string, Record<string, unknown>>> = {};

        for (const [tableName, table] of this.tables) {
            data[tableName] = {};
            for (const [id, row] of table) {
                data[tableName][id] = row;
            }
        }

        try {
            writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
            this.dirty = false;
        } catch (err) {
            console.error(`💾 Failed to save data file: ${err}`);
        }
    }

    /**
     * Force immediate save and cleanup.
     */
    flush(): void {
        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
            this.saveTimer = null;
        }
        if (this.dirty) this.save();
    }

    /**
     * Get persistence stats.
     */
    stats(): { tables: number; totalRows: number; filePath: string } {
        const totalRows = [...this.tables.values()].reduce((n, t) => n + t.size, 0);
        return { tables: this.tables.size, totalRows, filePath: this.filePath };
    }
}
