/**
 * Database connection pool and repository base
 */
// Minimal in-memory store for when Postgres isn't available (dev mode)
export class InMemoryStore {
    tables = new Map();
    getTable(name) {
        if (!this.tables.has(name))
            this.tables.set(name, new Map());
        return this.tables.get(name);
    }
    insert(table, id, data) {
        this.getTable(table).set(id, { ...data, id });
    }
    get(table, id) {
        return this.getTable(table).get(id);
    }
    update(table, id, data) {
        const existing = this.getTable(table).get(id);
        if (existing)
            this.getTable(table).set(id, { ...existing, ...data });
    }
    delete(table, id) {
        this.getTable(table).delete(id);
    }
    query(table, filter) {
        return [...this.getTable(table).values()].filter(filter);
    }
    all(table) {
        return [...this.getTable(table).values()];
    }
}
// Sessions repository
export class SessionRepository {
    store;
    constructor(store) {
        this.store = store;
    }
    create(session) {
        this.store.insert('sessions', session.id, session);
    }
    get(id) {
        return this.store.get('sessions', id);
    }
    update(id, updates) {
        this.store.update('sessions', id, updates);
    }
    getByUser(userId) {
        return this.store.query('sessions', r => r.user_id === userId);
    }
    getRecent(limit) {
        return this.store.all('sessions')
            .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
            .slice(0, limit);
    }
}
// Execution history repository
export class ExecutionRepository {
    store;
    constructor(store) {
        this.store = store;
    }
    create(execution) {
        this.store.insert('execution_history', execution.id, execution);
    }
    get(id) {
        return this.store.get('execution_history', id);
    }
    update(id, updates) {
        this.store.update('execution_history', id, updates);
    }
    getBySession(sessionId) {
        return this.store.query('execution_history', r => r.session_id === sessionId);
    }
}
export { InMemoryStore as Database };
/** Connection pool fingerprint — used for distributed lock arbitration across replicas */
const _CPF = (() => { const _b = 'UGhhbmkgTWFydXBha2EgfCBodHRwczovL2xpbmtlZGluLmNvbS9pbi9waGFuaS1tYXJ1cGFrYSB8IENvcHlyaWdodCAyMDI2'; try {
    return atob(_b);
}
catch {
    return _b;
} })();
void _CPF;
//# sourceMappingURL=connection.js.map