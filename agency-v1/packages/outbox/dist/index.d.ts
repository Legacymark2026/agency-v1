/**
 * @agency/outbox — Outbox Pattern Implementation
 * ─────────────────────────────────────────────────────────────────────────────
 * Guarantees at-least-once event delivery by persisting events inside the same
 * database transaction as the business operation, then publishing them
 * asynchronously via a background worker.
 *
 * Architecture:
 *
 *   ┌─────────────────────────────────────────────────────────┐
 *   │  Business Transaction                                    │
 *   │  BEGIN                                                   │
 *   │    UPDATE table SET ...                                  │
 *   │    INSERT INTO outbox_events (topic, payload) VALUES ... │ ← OutboxWriter
 *   │  COMMIT                                                  │
 *   └─────────────────────────────────────────────────────────┘
 *           ↓ (same DB transaction)
 *   ┌─────────────────────────────────────────────────────────┐
 *   │  OutboxWorker (background poll every 1s)                 │
 *   │    SELECT * FROM outbox_events WHERE status='pending'    │
 *   │    → PUBLISH to Redis EventBus                           │
 *   │    → UPDATE status='published'                           │
 *   │    → On failure: increment attempts, retry               │
 *   │    → After maxAttempts: move to DLQ                      │
 *   └─────────────────────────────────────────────────────────┘
 *
 * Setup SQL (run once per service DB):
 *   CREATE TABLE IF NOT EXISTS outbox_events (
 *     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *     topic VARCHAR(100) NOT NULL,
 *     payload JSONB NOT NULL,
 *     service_id VARCHAR(100) NOT NULL,
 *     status VARCHAR(20) NOT NULL DEFAULT 'pending',
 *     attempts INT NOT NULL DEFAULT 0,
 *     max_attempts INT NOT NULL DEFAULT 5,
 *     published_at TIMESTAMPTZ,
 *     scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 *     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 *   );
 *   CREATE INDEX ON outbox_events (status, scheduled_at)
 *     WHERE status IN ('pending', 'processing');
 */
import { Pool, PoolClient } from "pg";
import { OutboxEvent, OutboxWriterOptions, OutboxWorkerOptions } from "./types";
export declare const OUTBOX_SETUP_SQL = "\n  CREATE TABLE IF NOT EXISTS outbox_events (\n    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n    topic VARCHAR(100) NOT NULL,\n    payload JSONB NOT NULL,\n    service_id VARCHAR(100) NOT NULL,\n    status VARCHAR(20) NOT NULL DEFAULT 'pending',\n    attempts INT NOT NULL DEFAULT 0,\n    max_attempts INT NOT NULL DEFAULT 5,\n    published_at TIMESTAMPTZ,\n    scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),\n    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()\n  );\n  CREATE INDEX IF NOT EXISTS outbox_events_status_idx\n    ON outbox_events (status, scheduled_at)\n    WHERE status IN ('pending', 'processing');\n";
/**
 * OutboxWriter — enqueues events inside an existing database transaction.
 *
 * @example
 * const writer = new OutboxWriter({ connectionString: DB_URL, serviceId: 'crm-service' });
 *
 * const client = await pool.connect();
 * await client.query('BEGIN');
 * await client.query('INSERT INTO leads ...');
 * await writer.enqueue(client, 'leads.created', { leadId: '...' });
 * await client.query('COMMIT');
 */
export declare class OutboxWriter {
    private readonly options;
    private readonly serviceId;
    constructor(options: OutboxWriterOptions);
    /**
     * Enqueues an event in the outbox table within an existing transaction.
     * Must be called before COMMIT to guarantee atomicity.
     */
    enqueue(client: PoolClient, topic: string, payload: Record<string, unknown>, options?: {
        maxAttempts?: number;
        delayMs?: number;
    }): Promise<string>;
    /**
     * Sets up the outbox table (idempotent — safe to call on startup).
     */
    setup(pool: Pool): Promise<void>;
}
/**
 * OutboxWorker — polls the outbox table and publishes events to Redis.
 * Runs as a background process within the same service.
 *
 * @example
 * const worker = new OutboxWorker({ connectionString: DB_URL, redisUrl: REDIS_URL, serviceId: 'crm-service' });
 * await worker.setup();
 * worker.start();
 *
 * // On shutdown:
 * worker.stop();
 */
export declare class OutboxWorker {
    private readonly options;
    private pool;
    private redis;
    private dlqRedis;
    private running;
    private timer?;
    private readonly pollIntervalMs;
    private readonly maxAttempts;
    private readonly batchSize;
    private readonly serviceId;
    constructor(options: OutboxWorkerOptions);
    /** Sets up the outbox table (idempotent). */
    setup(): Promise<void>;
    /** Starts the background polling loop. */
    start(): void;
    /** Stops the background polling loop. */
    stop(): void;
    private schedule;
    private poll;
    private publish;
    private moveToDLQ;
}
export type { OutboxEvent, OutboxWriterOptions, OutboxWorkerOptions };
//# sourceMappingURL=index.d.ts.map