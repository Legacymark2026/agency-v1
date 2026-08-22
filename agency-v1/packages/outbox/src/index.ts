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
import Redis from "ioredis";
import { v4 as uuidv4 } from "uuid";
import { OutboxEvent, OutboxWriterOptions, OutboxWorkerOptions } from "./types";

// ── SQL for setup ─────────────────────────────────────────────────────────────
export const OUTBOX_SETUP_SQL = `
  CREATE TABLE IF NOT EXISTS outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    service_id VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    attempts INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 5,
    published_at TIMESTAMPTZ,
    scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS outbox_events_status_idx
    ON outbox_events (status, scheduled_at)
    WHERE status IN ('pending', 'processing');
`;

// ── OutboxWriter ──────────────────────────────────────────────────────────────

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
export class OutboxWriter {
  private readonly serviceId: string;

  constructor(private readonly options: OutboxWriterOptions) {
    this.serviceId = options.serviceId;
  }

  /**
   * Enqueues an event in the outbox table within an existing transaction.
   * Must be called before COMMIT to guarantee atomicity.
   */
  async enqueue(
    client: PoolClient,
    topic: string,
    payload: Record<string, unknown>,
    options?: { maxAttempts?: number; delayMs?: number }
  ): Promise<string> {
    const id = uuidv4();
    const maxAttempts = options?.maxAttempts ?? 5;
    const scheduledAt = options?.delayMs
      ? new Date(Date.now() + options.delayMs)
      : new Date();

    await client.query(
      `INSERT INTO outbox_events
         (id, topic, payload, service_id, status, attempts, max_attempts, scheduled_at)
       VALUES ($1, $2, $3, $4, 'pending', 0, $5, $6)`,
      [id, topic, JSON.stringify(payload), this.serviceId, maxAttempts, scheduledAt]
    );

    return id;
  }

  /**
   * Sets up the outbox table (idempotent — safe to call on startup).
   */
  async setup(pool: Pool): Promise<void> {
    await pool.query(OUTBOX_SETUP_SQL);
  }
}

// ── OutboxWorker ──────────────────────────────────────────────────────────────

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
export class OutboxWorker {
  private pool: Pool;
  private redis: Redis;
  private dlqRedis: Redis;
  private running = false;
  private timer?: ReturnType<typeof setTimeout>;

  private readonly pollIntervalMs: number;
  private readonly maxAttempts: number;
  private readonly batchSize: number;
  private readonly serviceId: string;

  constructor(private readonly options: OutboxWorkerOptions) {
    this.serviceId = options.serviceId;
    this.pollIntervalMs = options.pollIntervalMs ?? 1000;
    this.maxAttempts = options.maxAttempts ?? 5;
    this.batchSize = options.batchSize ?? 10;

    this.pool = new Pool({ connectionString: options.connectionString });
    this.redis = new Redis(options.redisUrl, { lazyConnect: true, enableReadyCheck: false });
    this.dlqRedis = new Redis(options.redisUrl, { lazyConnect: true, enableReadyCheck: false });
  }

  /** Sets up the outbox table (idempotent). */
  async setup(): Promise<void> {
    await this.pool.query(OUTBOX_SETUP_SQL);
    await this.redis.connect();
    await this.dlqRedis.connect();
    console.log(`[outbox-worker:${this.serviceId}] Setup complete`);
  }

  /** Starts the background polling loop. */
  start(): void {
    if (this.running) return;
    this.running = true;
    console.log(`[outbox-worker:${this.serviceId}] Started (interval: ${this.pollIntervalMs}ms)`);
    this.schedule();
  }

  /** Stops the background polling loop. */
  stop(): void {
    this.running = false;
    if (this.timer) clearTimeout(this.timer);
    console.log(`[outbox-worker:${this.serviceId}] Stopped`);
  }

  private schedule(): void {
    this.timer = setTimeout(async () => {
      if (!this.running) return;
      try {
        await this.poll();
      } catch (err) {
        console.error(`[outbox-worker:${this.serviceId}] Poll error:`, err);
      }
      this.schedule();
    }, this.pollIntervalMs);
  }

  private async poll(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      // Lock pending events (skip locked = no race condition between replicas)
      const { rows } = await client.query<OutboxEvent>(
        `SELECT id, topic, payload, service_id, attempts, max_attempts
         FROM outbox_events
         WHERE status = 'pending'
           AND scheduled_at <= NOW()
           AND service_id = $1
         ORDER BY scheduled_at ASC
         LIMIT $2
         FOR UPDATE SKIP LOCKED`,
        [this.serviceId, this.batchSize]
      );

      if (rows.length === 0) {
        await client.query("ROLLBACK");
        return;
      }

      // Mark as processing
      const ids = rows.map((r) => r.id);
      await client.query(
        `UPDATE outbox_events SET status = 'processing', attempts = attempts + 1
         WHERE id = ANY($1::uuid[])`,
        [ids]
      );

      await client.query("COMMIT");

      // Publish each event
      for (const event of rows) {
        try {
          await this.publish(event);
          await this.pool.query(
            `UPDATE outbox_events
             SET status = 'published', published_at = NOW()
             WHERE id = $1`,
            [event.id]
          );
        } catch (publishErr) {
          console.error(`[outbox-worker:${this.serviceId}] Publish error for ${event.id}:`, publishErr);

          const nextAttempt = (event.attempts ?? 0) + 1;
          if (nextAttempt >= (event.maxAttempts ?? this.maxAttempts)) {
            // Move to Dead Letter Queue
            await this.moveToDLQ(event);
            await this.pool.query(
              `UPDATE outbox_events SET status = 'dead' WHERE id = $1`,
              [event.id]
            );
            console.error(`[outbox-worker:${this.serviceId}] Moved to DLQ: ${event.id} (topic: ${event.topic})`);
          } else {
            // Exponential backoff: retry after 2^attempt seconds
            const backoffMs = Math.pow(2, nextAttempt) * 1000;
            await this.pool.query(
              `UPDATE outbox_events
               SET status = 'pending', scheduled_at = NOW() + interval '${backoffMs} milliseconds'
               WHERE id = $1`,
              [event.id]
            );
          }
        }
      }
    } catch (err) {
      await client.query("ROLLBACK").catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  }

  private async publish(event: OutboxEvent): Promise<void> {
    const message = JSON.stringify({
      id: event.id,
      topic: event.topic,
      payload: event.payload,
      serviceId: event.serviceId,
      publishedAt: new Date().toISOString(),
    });
    await this.redis.publish(event.topic, message);
  }

  private async moveToDLQ(event: OutboxEvent): Promise<void> {
    const dlqKey = `dead-letter:${this.serviceId}:${event.topic}`;
    await this.dlqRedis.lpush(
      dlqKey,
      JSON.stringify({
        ...event,
        failedAt: new Date().toISOString(),
      })
    );
    // Keep dead-letter entries for 7 days
    await this.dlqRedis.expire(dlqKey, 7 * 24 * 60 * 60);
  }
}

export type { OutboxEvent, OutboxWriterOptions, OutboxWorkerOptions };
