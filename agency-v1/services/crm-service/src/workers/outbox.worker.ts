/**
 * Outbox Message Relay Worker & CQRS Synchronizer — CRM Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Polls tbl_outbox_events for PENDING/FAILED events and publishes them to EventBus.
 * Uses PostgreSQL LISTEN/NOTIFY ('outbox_event_inserted') with a 30-second polling fallback.
 * Synchronizes CQRS Write DB events to Read DB (Redis).
 */
import { prisma } from "@agency/database";
import { Client } from "pg";
import { eventBus, redisClient } from "../lib/event-bus.singleton";
import { logger } from "../utils/logger.utils";

let pgClient: Client | null = null;
let pollIntervalId: NodeJS.Timeout | null = null;

export function initCqrsSubscriptions(): void {
  // CQRS Synchronizer: Listen to Write DB events and update Read DB (Redis)
  eventBus.subscribe("lead.created", async (payload) => {
    try {
      const { leadId, companyId, data } = (payload.data || {}) as any;
      if (leadId && companyId && data) {
        logger.info("[CQRS Worker] Synchronizing lead to Read DB (Redis)", { leadId, companyId });
        await redisClient.set(`cqrs:leads:${companyId}:${leadId}`, JSON.stringify(data));
      }
    } catch (err) {
      logger.error("[CQRS Worker] Failed to sync lead.created to Redis", { error: String(err) });
    }
  }).catch((err) => {
    logger.warn("[CQRS Worker] Failed to subscribe to lead.created", { error: String(err) });
  });

  eventBus.subscribe("invoice.paid", async (payload) => {
    const { dealId } = (payload.data || {}) as any;
    if (dealId) {
      logger.info("[crm-service] Invoice paid event received for deal", { dealId });
    }
  }).catch((err) => {
    logger.warn("[crm-service] Failed to subscribe to invoice.paid", { error: String(err) });
  });
}

export async function startMessageRelayWorker(): Promise<void> {
  initCqrsSubscriptions();

  let isPolling = false;
  let pendingPoll = false;

  const poll = async () => {
    if (isPolling) {
      pendingPoll = true;
      return;
    }
    isPolling = true;
    pendingPoll = false;

    try {
      let hasMore = true;
      while (hasMore) {
        const pendingEvents = await prisma.outboxEvent.findMany({
          where: {
            status: { in: ["PENDING", "FAILED"] },
            attempts: { lt: 3 },
          },
          orderBy: { createdAt: "asc" },
          take: 20,
        });

        if (pendingEvents.length === 0) {
          hasMore = false;
          break;
        }

        for (const event of pendingEvents) {
          try {
            const payloadData = event.payload as Record<string, unknown>;
            await eventBus.publish(event.eventName as any, payloadData, event.correlationId);

            await prisma.outboxEvent.update({
              where: { id: event.id },
              data: {
                status: "PROCESSED",
                processedAt: new Date(),
                attempts: { increment: 1 },
              },
            });
          } catch (pubErr) {
            logger.error(`[MessageRelayWorker] Failed to publish outbox event ${event.id}:`, { error: String(pubErr) });

            await prisma.outboxEvent.update({
              where: { id: event.id },
              data: {
                attempts: { increment: 1 },
                status: "FAILED",
              },
            });
          }
        }
      }
    } catch (err) {
      logger.error(`[MessageRelayWorker] Error checking outbox events:`, { error: String(err) });
    } finally {
      isPolling = false;
      if (pendingPoll) {
        setTimeout(poll, 0);
      }
    }
  };

  // Setup Postgres client to LISTEN for notifications directly from postgres (port 5432)
  let connectionString = process.env.CORE_DATABASE_URL || process.env.DATABASE_URL || "postgresql://legacymark:legacymark_dev@postgres:5432/legacymark_core";
  connectionString = connectionString
    .replace("pgbouncer:6432", "postgres:5432")
    .replace("pgbouncer=true", "pgbouncer=false");

  pgClient = new Client({ connectionString });

  const connectAndListen = async () => {
    if (!pgClient) return;
    try {
      await pgClient.connect();
      await pgClient.query("LISTEN outbox_event_inserted");
      logger.info("🔔 Message Relay Worker: Pg LISTEN connected & listening on 'outbox_event_inserted'");

      pgClient.on("notification", (msg) => {
        logger.info(`🔔 Notification received for outbox event: ${msg.payload}`);
        poll();
      });

      pgClient.on("error", async (err) => {
        logger.error("🔔 PG Listener Client error:", { error: String(err) });
        try {
          await pgClient?.end();
        } catch {}
        pgClient = new Client({ connectionString });
        setTimeout(connectAndListen, 5000);
      });
    } catch (err) {
      logger.error("🔔 Failed to connect PG Listener client, retrying in 5s:", { error: String(err) });
      setTimeout(connectAndListen, 5000);
    }
  };

  await connectAndListen();

  // Fallback passive check every 30 seconds
  pollIntervalId = setInterval(poll, 30000);

  // Initial run
  poll();
  logger.info("📨 Message Relay Worker started");
}

export async function stopMessageRelayWorker(): Promise<void> {
  if (pollIntervalId) {
    clearInterval(pollIntervalId);
    pollIntervalId = null;
  }
  if (pgClient) {
    try {
      await pgClient.end();
    } catch {}
    pgClient = null;
  }
}
