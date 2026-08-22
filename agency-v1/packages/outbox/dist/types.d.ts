export interface OutboxEvent {
    id: string;
    topic: string;
    payload: Record<string, unknown>;
    serviceId: string;
    status: "pending" | "processing" | "published" | "dead";
    attempts: number;
    maxAttempts: number;
    publishedAt?: Date;
    createdAt: Date;
    scheduledAt: Date;
}
export interface OutboxWriterOptions {
    /** PostgreSQL connection string */
    connectionString: string;
    /** Schema to use (default: 'public') */
    schema?: string;
    /** Service identifier for this outbox instance */
    serviceId: string;
}
export interface OutboxWorkerOptions extends OutboxWriterOptions {
    /** Redis URL for publishing events */
    redisUrl: string;
    /** Poll interval in milliseconds (default: 1000) */
    pollIntervalMs?: number;
    /** Max retry attempts before moving to DLQ (default: 5) */
    maxAttempts?: number;
    /** Batch size per poll cycle (default: 10) */
    batchSize?: number;
}
//# sourceMappingURL=types.d.ts.map