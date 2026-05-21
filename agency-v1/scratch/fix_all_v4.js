/**
 * fix_all_v4.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Master fix script for Agency V4 architecture.
 * 
 * STRATEGY: The temp_schemas backup already has camelCase + @@map("table_name")
 * We need to:
 * 1. Transform schema.prisma: prefix all @@map values with tbl_ (tbl_users, etc.)
 *    and add @@map("tbl_xxx") to models that don't have @@map yet.
 *    We keep ALL model names and field names as camelCase.
 * 2. Add the OutboxEvent model (camelCase, mapped to tbl_outbox_events)
 * 3. Rewrite the 4 modified services to use camelCase Prisma client API
 */

const fs = require('fs');
const path = require('path');

const ROOT = 'c:/Users/hboho/.gemini/antigravity/scratch/agency-v1';

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 1: Fix schema.prisma - restore camelCase + add tbl_ prefix to @@map
// ─────────────────────────────────────────────────────────────────────────────

function fixMainSchema() {
  const SRC  = path.join(ROOT, 'scratch/temp_schemas/schema.prisma');
  const DEST = path.join(ROOT, 'packages/database/prisma/schema.prisma');
  
  let content = fs.readFileSync(SRC, 'utf8');
  
  // 1. Prefix all @@map("xxx") values with tbl_ if not already prefixed
  content = content.replace(/@@map\("([^"]+)"\)/g, (match, tableName) => {
    if (tableName.startsWith('tbl_')) return match;
    return `@@map("tbl_${tableName}")`;
  });
  
  // 2. For models that don't have @@map, we need to add one
  //    But actually the backup already has @@map on all models, so step 1 covers it.
  
  // 3. Append the OutboxEvent model
  const OUTBOX = `
// ══════════════════════════════════════════════════════════════
// TRANSACTIONAL OUTBOX — Garantía de Consistencia Eventual
// (Netflix / Google Dapper Pattern)
// ══════════════════════════════════════════════════════════════

model OutboxEvent {
  id            String    @id @default(uuid())
  eventName     String    @map("col_event_name")
  payload       Json      @map("col_payload")
  status        String    @default("PENDING") @map("col_status")
  attempts      Int       @default(0) @map("col_attempts")
  correlationId String    @map("col_correlation_id")
  createdAt     DateTime  @default(now()) @map("col_created_at")
  processedAt   DateTime? @map("col_processed_at")
  schemaVersion Int       @default(1) @map("col_schema_version")

  @@index([status])
  @@index([correlationId])
  @@map("tbl_outbox_events")
}
`;
  
  if (!content.includes('OutboxEvent') && !content.includes('tbl_outbox_events')) {
    content += OUTBOX;
  }
  
  fs.writeFileSync(DEST, content, 'utf8');
  console.log(`✅ schema.prisma restored to camelCase with tbl_ prefix on @@map`);
  console.log(`   Lines: ${content.split('\n').length}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 2: Fix the sub-schemas (auth, core, media, analytics)
// ─────────────────────────────────────────────────────────────────────────────

function fixSubSchemas() {
  const subSchemas = ['schema.auth.prisma', 'schema.core.prisma', 'schema.media.prisma', 'schema.analytics.prisma'];
  
  for (const schemaFile of subSchemas) {
    const srcPath  = path.join(ROOT, 'scratch/temp_schemas', schemaFile);
    const destPath = path.join(ROOT, 'packages/database/prisma', schemaFile);
    
    if (!fs.existsSync(srcPath)) {
      console.log(`⚠️  No backup found for ${schemaFile}, skipping`);
      continue;
    }
    
    let content = fs.readFileSync(srcPath, 'utf8');
    
    // Prefix all @@map("xxx") values with tbl_
    content = content.replace(/@@map\("([^"]+)"\)/g, (match, tableName) => {
      if (tableName.startsWith('tbl_')) return match;
      return `@@map("tbl_${tableName}")`;
    });
    
    fs.writeFileSync(destPath, content, 'utf8');
    console.log(`✅ ${schemaFile} restored to camelCase with tbl_ prefix`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 3: Rewrite services to use camelCase Prisma client
// ─────────────────────────────────────────────────────────────────────────────

function rewriteCrmService() {
  const filePath = path.join(ROOT, 'services/crm-service/src/index.ts');
  
  const content = `/**
 * CRM Service — Customer Relationship Management Microservice
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles: Leads, Deals, Pipeline, Scoring, Sequences, Commissions
 * Port: 4002
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import { prisma } from "@agency/database";
import { EventBus } from "@agency/events";
import Redis from "ioredis";

const app = express();
const PORT = parseInt(process.env.PORT || "4002", 10);
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "5mb" }));

// ── Health Checks ────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "healthy", service: "crm-service", timestamp: new Date().toISOString() });
});

app.get("/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw\`SELECT 1\`;
    res.json({ status: "ready", db: "connected" });
  } catch (err) {
    res.status(503).json({ status: "not_ready", error: String(err) });
  }
});

// ── Leads ────────────────────────────────────────────────────────────────────

app.get("/api/leads", async (req, res) => {
  try {
    const { companyId, status, page = "1", limit = "20" } = req.query;
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    const where: Record<string, unknown> = { companyId: String(companyId) };
    if (status) where.status = String(status);

    const skip = (parseInt(String(page)) - 1) * parseInt(String(limit));
    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: parseInt(String(limit)),
        skip,
      }),
      prisma.lead.count({ where }),
    ]);

    res.json({ leads, total, page: parseInt(String(page)), limit: parseInt(String(limit)) });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post("/api/leads", async (req, res) => {
  try {
    const correlationId = (req.headers["x-correlation-id"] || \`trace-\${Date.now()}-\${Math.random().toString(36).slice(2, 9)}\`) as string;

    // Atomically persist Lead and create OutboxEvent in a single transaction
    // Guarantees Transactional Outbox consistency — if Redis is down, data is safe in tbl_outbox_events
    const lead = await prisma.$transaction(async (tx) => {
      const createdLead = await tx.lead.create({ data: req.body });
      await tx.outboxEvent.create({
        data: {
          eventName: "lead.created",
          payload: { leadId: createdLead.id, companyId: createdLead.companyId, data: createdLead },
          correlationId,
        },
      });
      return createdLead;
    });

    res.status(201).json({ lead });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── CQRS: Fast Read DB Endpoint (Redis Materialized View) ────────────────────
app.get("/api/cqrs/leads", async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    const keys = await redisClient.keys(\`cqrs:leads:\${companyId}:*\`);
    if (keys.length === 0) {
      return res.json({ leads: [], source: "read_db_redis", note: "No leads in materialized view yet" });
    }

    const leads = await Promise.all(keys.map(k => redisClient.get(k)));
    const parsedLeads = leads.filter(Boolean).map(l => JSON.parse(l!));

    res.json({ leads: parsedLeads, source: "read_db_redis", latency: "sub-millisecond" });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Deals ────────────────────────────────────────────────────────────────────

app.get("/api/deals", async (req, res) => {
  try {
    const { companyId, stage } = req.query;
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    const where: Record<string, unknown> = { companyId: String(companyId) };
    if (stage) where.stage = String(stage);

    const deals = await prisma.deal.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });

    res.json({ deals });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.patch("/api/deals/:id/stage", async (req, res) => {
  try {
    const { stage } = req.body;
    const deal = await prisma.deal.findUnique({ where: { id: req.params.id } });
    if (!deal) return res.status(404).json({ error: "Deal not found" });

    const updated = await prisma.deal.update({
      where: { id: req.params.id },
      data: { stage },
    });

    await eventBus.publish("deal.stage_changed", {
      dealId: deal.id,
      companyId: deal.companyId,
      fromStage: deal.stage,
      toStage: stage,
    });

    if (stage === "WON") {
      await eventBus.publish("deal.won", { dealId: deal.id, value: deal.value, companyId: deal.companyId });
    }

    res.json({ deal: updated });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Pipeline Analytics ───────────────────────────────────────────────────────

app.get("/api/crm/funnel/:companyId", async (req, res) => {
  try {
    const stages = await prisma.deal.groupBy({
      by: ["stage"],
      where: { companyId: req.params.companyId },
      _count: true,
      _sum: { value: true },
    });
    res.json({ funnel: stages });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Event Bus Setup & CQRS Worker ────────────────────────────────────────────
const eventBus = new EventBus(REDIS_URL, "crm-service");
const redisClient = new Redis(REDIS_URL);

// CQRS Synchronizer: Listen to Write DB events and update Read DB (Redis)
eventBus.subscribe("lead.created", async (payload) => {
  const { leadId, companyId, data } = payload.data as any;
  if (leadId && companyId && data) {
    console.log(\`[CQRS Worker] Synchronizing lead \${leadId} to Read DB (Redis)\`);
    await redisClient.set(\`cqrs:leads:\${companyId}:\${leadId}\`, JSON.stringify(data));
  }
});

eventBus.subscribe("invoice.paid", async (payload) => {
  const { dealId } = payload.data;
  if (dealId) {
    console.log(\`[crm-service] Invoice paid for deal \${dealId}\`);
  }
});

// ── Message Relay Worker ─────────────────────────────────────────────────────
/**
 * Polls tbl_outbox_events for PENDING/FAILED events and publishes them to EventBus.
 * This decouples the HTTP request from the Redis publish, guaranteeing
 * at-least-once delivery even if Redis was down when the lead was created.
 */
const startMessageRelayWorker = () => {
  const INTERVAL_MS = 2000;

  const poll = async () => {
    try {
      const pendingEvents = await prisma.outboxEvent.findMany({
        where: {
          status: { in: ["PENDING", "FAILED"] },
          attempts: { lt: 3 },
        },
        orderBy: { createdAt: "asc" },
        take: 20,
      });

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
          console.error(\`[MessageRelayWorker] Failed to publish outbox event \${event.id}:\`, pubErr);

          await prisma.outboxEvent.update({
            where: { id: event.id },
            data: {
              attempts: { increment: 1 },
              status: "FAILED",
            },
          });
        }
      }
    } catch (err) {
      console.error(\`[MessageRelayWorker] Error checking outbox events:\`, err);
    } finally {
      setTimeout(poll, INTERVAL_MS);
    }
  };

  setTimeout(poll, INTERVAL_MS);
  console.log("📨 Message Relay Worker started");
};

startMessageRelayWorker();

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(\`📊 CRM Service running on port \${PORT}\`);
});

process.on("SIGTERM", async () => {
  await eventBus.disconnect();
  await prisma.$disconnect();
  process.exit(0);
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default app as any;
`;
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ crm-service rewritten to camelCase');
}

function rewriteAdminService() {
  const filePath = path.join(ROOT, 'services/admin-service/src/index.ts');
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace tbl_ prefixed model access with camelCase
  const replacements = [
    // Model names
    ['prisma.tbl_kanban_projects', 'prisma.kanbanProject'],
    ['prisma.tbl_kanban_tasks', 'prisma.kanbanTask'],
    ['prisma.tbl_kanban_swimlanes', 'prisma.kanbanSwimlane'],
    // Fields in where/orderBy/data
    ['col_company_id:', 'companyId:'],
    ['col_deal_id:', 'dealId:'],
    ['col_name:', 'name:'],
    ['col_description:', 'description:'],
    ['col_title:', 'title:'],
    ['col_status:', 'status:'],
    ['col_priority:', 'priority:'],
    ['col_order:', 'order:'],
    ['col_project_id:', 'projectId:'],
    ['col_assignee_id:', 'assigneeId:'],
    ['col_creator_id:', 'creatorId:'],
    ['col_due_date:', 'dueDate:'],
    ['col_estimated_hours:', 'estimatedHours:'],
    ['col_swimlane_id:', 'swimlaneId:'],
    ['col_created_at:', 'createdAt:'],
    ['col_updated_at:', 'updatedAt:'],
    // Select fields (in select objects)
    ['col_title', 'title'],
    ['col_description', 'description'],
    ['col_status', 'status'],
    ['col_priority', 'priority'],
    ['col_order', 'order'],
    ['col_project_id', 'projectId'],
    ['col_assignee_id', 'assigneeId'],
    ['col_creator_id', 'creatorId'],
    ['col_due_date', 'dueDate'],
    ['col_estimated_hours', 'estimatedHours'],
    ['col_swimlane_id', 'swimlaneId'],
    ['col_created_at', 'createdAt'],
    ['col_updated_at', 'updatedAt'],
    ['col_company_id', 'companyId'],
    ['col_deal_id', 'dealId'],
    ['col_name', 'name'],
    ['col_image', 'image'],
    ['col_value', 'value'],
    ['col_stage', 'stage'],
    // Relation includes
    ['col_kanban_tasks', 'kanbanTasks'],
    ['col_swimlanes', 'swimlanes'],
    ['col_deal', 'deal'],
    ['col_assignee', 'assignee'],
  ];
  
  for (const [from, to] of replacements) {
    content = content.split(from).join(to);
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ admin-service rewritten to camelCase');
}

function rewriteFinanceService() {
  const filePath = path.join(ROOT, 'services/finance-service/src/index.ts');
  let content = fs.readFileSync(filePath, 'utf8');
  
  const replacements = [
    // Model names
    ['prisma.tbl_invoices', 'prisma.invoice'],
    ['prisma.tbl_payrolls', 'prisma.payroll'],
    ['prisma.tbl_expenses', 'prisma.expense'],
    ['prisma.tbl_commission_rules', 'prisma.commissionRule'],
    ['prisma.tbl_commission_payments', 'prisma.commissionPayment'],
    ['prisma.tbl_service_prices', 'prisma.servicePrice'],
    // Fields
    ['col_company_id:', 'companyId:'],
    ['col_status:', 'status:'],
    ['col_created_at:', 'createdAt:'],
    ['col_period_end:', 'periodEnd:'],
    ['col_date:', 'date:'],
    ['col_deal_id:', 'dealId:'],
    ['col_total_amount:', 'totalAmount:'],
    ['col_items:', 'items:'],
    ['col_employee:', 'employee:'],
    ['col_category:', 'category:'],
    // Field access on returned objects
    ['invoice.col_company_id', 'invoice.companyId'],
    ['invoice.col_deal_id', 'invoice.dealId'],
    ['invoice.col_total_amount', 'invoice.totalAmount'],
    ['invoice.col_status', 'invoice.status'],
    // Relation includes
    ['col_items', 'items'],
    ['col_employee', 'employee'],
    ['col_category', 'category'],
  ];
  
  for (const [from, to] of replacements) {
    content = content.split(from).join(to);
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ finance-service rewritten to camelCase');
}

function rewriteInboxService() {
  const filePath = path.join(ROOT, 'services/inbox-service/src/index.ts');
  let content = fs.readFileSync(filePath, 'utf8');
  
  const replacements = [
    // Model names
    ['prisma.tbl_conversations', 'prisma.conversation'],
    ['prisma.tbl_messages', 'prisma.message'],
    ['prisma.tbl_inbox_audit_logs', 'prisma.inboxAuditLog'],
    // Fields
    ['col_company_id:', 'companyId:'],
    ['col_status:', 'status:'],
    ['col_channel:', 'channel:'],
    ['col_last_message_at:', 'lastMessageAt:'],
    ['col_conversation_id:', 'conversationId:'],
    ['col_created_at:', 'createdAt:'],
    ['col_content:', 'content:'],
    ['col_type:', 'type:'],
    ['col_direction:', 'direction:'],
    ['col_sender_id:', 'senderId:'],
    ['col_assigned_to:', 'assignedTo:'],
    // Field access on returned objects
    ['col_company_id', 'companyId'],
    ['col_status', 'status'],
    ['col_channel', 'channel'],
    ['col_last_message_at', 'lastMessageAt'],
    ['col_conversation_id', 'conversationId'],
    ['col_created_at', 'createdAt'],
    ['col_content', 'content'],
    ['col_type', 'type'],
    ['col_direction', 'direction'],
    ['col_sender_id', 'senderId'],
    // Relation includes
    ['col_lead', 'lead'],
    ['col_assignee', 'assignee'],
    ['col_attachments', 'attachments'],
    ['col_name', 'name'],
    ['col_email', 'email'],
    ['col_image', 'image'],
  ];
  
  for (const [from, to] of replacements) {
    content = content.split(from).join(to);
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ inbox-service rewritten to camelCase');
}

// ─────────────────────────────────────────────────────────────────────────────
// RUN ALL PHASES
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n🔧 Phase 1: Fixing Prisma schemas (restore camelCase + tbl_ prefix in @@map)...');
fixMainSchema();
fixSubSchemas();

console.log('\n🔧 Phase 2: Rewriting modified services to camelCase Prisma API...');
rewriteCrmService();
rewriteAdminService();
rewriteFinanceService();
rewriteInboxService();

console.log('\n✅ All fixes applied! Next steps:');
console.log('   1. cd packages/database && npx prisma generate');
console.log('   2. npm run build');
