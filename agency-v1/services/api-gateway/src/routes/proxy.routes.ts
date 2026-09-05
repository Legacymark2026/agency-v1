/**
 * Microservice Proxy Routing Table — API Gateway
 * ─────────────────────────────────────────────────────────────────────────────
 * Routes all incoming REST traffic to the appropriate microservices with:
 *   - Circuit Breaker failure protection
 *   - Dynamic Redis URL resolution with Docker DNS fallback
 *   - Automatic propagation of verified identity headers (x-user-id, x-company-id)
 *   - Path preservation using req.originalUrl
 */
import { Router, Request, Response, NextFunction } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { SERVICES, ServiceName, resolveServiceUrl } from "../lib/service-registry";
import { getBreaker, handleCircuitFallback } from "../lib/circuit-breaker";

export function createResilientProxy(serviceName: ServiceName, fallbackTarget: string) {
  const breaker = getBreaker(serviceName);

  const proxy = createProxyMiddleware({
    target: fallbackTarget,
    router: async () => {
      return await resolveServiceUrl(serviceName);
    },
    changeOrigin: true,
    timeout: 10000,
    proxyTimeout: 10000,
    on: {
      proxyReq: (proxyReq, req: any) => {
        // Forward correlation tracking
        if (req.headers["x-correlation-id"]) {
          proxyReq.setHeader("x-correlation-id", req.headers["x-correlation-id"]);
        }

        // Forward pre-authenticated identity headers injected by authenticateGatewayRequest
        if (req.headers["x-user-id"]) {
          proxyReq.setHeader("x-user-id", String(req.headers["x-user-id"]));
        }
        if (req.headers["x-company-id"]) {
          proxyReq.setHeader("x-company-id", String(req.headers["x-company-id"]));
        }
        if (req.headers["x-user-role"]) {
          proxyReq.setHeader("x-user-role", String(req.headers["x-user-role"]));
        }
      },
      proxyRes: (proxyRes) => {
        if (proxyRes.statusCode && [502, 503, 504].includes(proxyRes.statusCode)) {
          breaker.recordFailure();
        } else {
          breaker.recordSuccess();
        }
      },
      error: async (err: any, req: any, res: any) => {
        const target = await resolveServiceUrl(serviceName);
        console.error(`[CircuitBreaker] Proxy error for ${serviceName} to ${target}:`, err.message);

        if (err.code !== "EAI_AGAIN" && !err.message?.includes("EAI_AGAIN")) {
          breaker.recordFailure();
        }

        await handleCircuitFallback(req, res, serviceName, `Downstream error: ${err.message}`);
      },
    },
  });

  return async (req: Request, res: Response, next: NextFunction) => {
    breaker.checkState();

    if (breaker.state === "OPEN") {
      return handleCircuitFallback(req, res, serviceName, "Circuit breaker is open");
    }

    // Restore full path for upstream microservices
    if (req.originalUrl && req.url !== req.originalUrl) {
      req.url = req.originalUrl;
    }

    return (proxy as any)(req, res, next);
  };
}

export const proxyRouter = Router();

// ── Service Route Mappings ───────────────────────────────────────────────────

// Auth Service
proxyRouter.use("/api/auth", createResilientProxy("auth", SERVICES.auth));
proxyRouter.use("/api/v1/auth", createResilientProxy("auth", SERVICES.auth));

// CRM Service
proxyRouter.use("/api/leads", createResilientProxy("crm", SERVICES.crm));
proxyRouter.use("/api/deals", createResilientProxy("crm", SERVICES.crm));
proxyRouter.use("/api/crm", createResilientProxy("crm", SERVICES.crm));

// Automation Service
proxyRouter.use("/api/workflows", createResilientProxy("automation", SERVICES.automation));
proxyRouter.use("/api/automation", createResilientProxy("automation", SERVICES.automation));
proxyRouter.use("/api/cron/run-automation", createResilientProxy("automation", SERVICES.automation));
proxyRouter.use("/api/cron/social-publisher", createResilientProxy("automation", SERVICES.automation));
proxyRouter.use("/api/cron/process-sequences", createResilientProxy("automation", SERVICES.automation));

// AI Engine
proxyRouter.use("/api/agents", createResilientProxy("ai", SERVICES.ai));
proxyRouter.use("/api/v1/agents", createResilientProxy("ai", SERVICES.ai));
proxyRouter.use("/api/ai", createResilientProxy("ai", SERVICES.ai));
proxyRouter.use("/api/knowledge-bases", createResilientProxy("ai", SERVICES.ai));

// Inbox Service
proxyRouter.use("/api/inbox", createResilientProxy("inbox", SERVICES.inbox));
proxyRouter.use("/api/webhooks/whatsapp", createResilientProxy("inbox", SERVICES.inbox));
proxyRouter.use("/api/webhooks/meta", createResilientProxy("inbox", SERVICES.inbox));
proxyRouter.use("/api/webhooks/channels", createResilientProxy("inbox", SERVICES.inbox));
proxyRouter.use("/api/cron/email-worker", createResilientProxy("inbox", SERVICES.inbox));

// Finance Service
proxyRouter.use("/api/invoices", createResilientProxy("finance", SERVICES.finance));
proxyRouter.use("/api/payroll", createResilientProxy("finance", SERVICES.finance));
proxyRouter.use("/api/expenses", createResilientProxy("finance", SERVICES.finance));
proxyRouter.use("/api/webhooks/stripe", createResilientProxy("finance", SERVICES.finance));
proxyRouter.use("/api/webhooks/paypal", createResilientProxy("finance", SERVICES.finance));
proxyRouter.use("/api/cron/subscriptions", createResilientProxy("finance", SERVICES.finance));

// Video Service
proxyRouter.use("/api/video", createResilientProxy("video", SERVICES.video));
proxyRouter.use("/api/media", createResilientProxy("video", SERVICES.video));

// Calendar Service
proxyRouter.use("/api/calendar", createResilientProxy("calendar", SERVICES.calendar));
proxyRouter.use("/api/scheduling", createResilientProxy("calendar", SERVICES.calendar));

// Marketing Service
proxyRouter.use("/api/marketing", createResilientProxy("marketing", SERVICES.marketing));
proxyRouter.use("/api/campaigns", createResilientProxy("marketing", SERVICES.marketing));
proxyRouter.use("/api/email-blast", createResilientProxy("marketing", SERVICES.marketing));
proxyRouter.use("/api/creative", createResilientProxy("marketing", SERVICES.marketing));
proxyRouter.use("/api/email-templates", createResilientProxy("marketing", SERVICES.marketing));
proxyRouter.use("/api/mailing-lists", createResilientProxy("marketing", SERVICES.marketing));
proxyRouter.use("/api/suppression-lists", createResilientProxy("marketing", SERVICES.marketing));
proxyRouter.use("/api/email-validation", createResilientProxy("marketing", SERVICES.marketing));
proxyRouter.use("/api/queue", createResilientProxy("marketing", SERVICES.marketing));
proxyRouter.use("/api/sequences", createResilientProxy("marketing", SERVICES.marketing));
proxyRouter.use("/api/domain-reputation", createResilientProxy("marketing", SERVICES.marketing));
proxyRouter.use("/api/reports", createResilientProxy("marketing", SERVICES.marketing));
proxyRouter.use("/api/segments", createResilientProxy("marketing", SERVICES.marketing));
proxyRouter.use("/api/templates", createResilientProxy("marketing", SERVICES.marketing));
proxyRouter.use("/api/compliance", createResilientProxy("marketing", SERVICES.marketing));

// Integration Service
proxyRouter.use("/api/integrations", createResilientProxy("integration", SERVICES.integration));
proxyRouter.use("/api/webhooks/shopify", createResilientProxy("integration", SERVICES.integration));
proxyRouter.use("/api/webhooks/wix", createResilientProxy("integration", SERVICES.integration));

// Document Service
proxyRouter.use("/api/proposals", createResilientProxy("document", SERVICES.document));
proxyRouter.use("/api/propuesta", createResilientProxy("document", SERVICES.document));
proxyRouter.use("/api/kb", createResilientProxy("document", SERVICES.document));

// Agent Team Engine
proxyRouter.use("/api/agent/teams", createResilientProxy("agentTeam", SERVICES.agentTeam));
proxyRouter.use("/api/agent/presets", createResilientProxy("agentTeam", SERVICES.agentTeam));
proxyRouter.use("/api/test-flow", createResilientProxy("agentTeam", SERVICES.agentTeam));

// Analytics Service
proxyRouter.use("/api/analytics", createResilientProxy("analytics", SERVICES.analytics));
proxyRouter.use("/api/track", createResilientProxy("analytics", SERVICES.analytics));

// Admin Service
proxyRouter.use("/api/admin", createResilientProxy("admin", SERVICES.admin));
proxyRouter.use("/api/diagnostics", createResilientProxy("admin", SERVICES.admin));
proxyRouter.use("/api/debug", createResilientProxy("admin", SERVICES.admin));

// Versioned /api/v1/* routes
proxyRouter.use("/api/v1/crm",          createResilientProxy("crm",          SERVICES.crm));
proxyRouter.use("/api/v1/leads",        createResilientProxy("crm",          SERVICES.crm));
proxyRouter.use("/api/v1/deals",        createResilientProxy("crm",          SERVICES.crm));
proxyRouter.use("/api/v1/inbox",        createResilientProxy("inbox",        SERVICES.inbox));
proxyRouter.use("/api/v1/invoices",     createResilientProxy("finance",      SERVICES.finance));
proxyRouter.use("/api/v1/payroll",      createResilientProxy("finance",      SERVICES.finance));
proxyRouter.use("/api/v1/marketing",    createResilientProxy("marketing",    SERVICES.marketing));
proxyRouter.use("/api/v1/campaigns",    createResilientProxy("marketing",    SERVICES.marketing));
proxyRouter.use("/api/v1/automation",   createResilientProxy("automation",   SERVICES.automation));
proxyRouter.use("/api/v1/workflows",    createResilientProxy("automation",   SERVICES.automation));
proxyRouter.use("/api/v1/notifications",createResilientProxy("notification", SERVICES.notification));
proxyRouter.use("/api/v1/employees",    createResilientProxy("hr",           SERVICES.hr));
proxyRouter.use("/api/v1/hr",           createResilientProxy("hr",           SERVICES.hr));
proxyRouter.use("/api/v1/projects",     createResilientProxy("project",      SERVICES.project));
proxyRouter.use("/api/v1/kanban",       createResilientProxy("project",      SERVICES.project));
proxyRouter.use("/api/v1/tasks",        createResilientProxy("project",      SERVICES.project));
proxyRouter.use("/api/v1/analytics",    createResilientProxy("analytics",    SERVICES.analytics));
proxyRouter.use("/api/v1/calendar",     createResilientProxy("calendar",     SERVICES.calendar));
proxyRouter.use("/api/v1/video",        createResilientProxy("video",        SERVICES.video));
proxyRouter.use("/api/v1/integrations", createResilientProxy("integration",  SERVICES.integration));

// Public API Service (catch-all for remaining public endpoints)
proxyRouter.use("/api/public", createResilientProxy("publicApi", SERVICES.publicApi));
proxyRouter.use("/api/serve",  createResilientProxy("publicApi", SERVICES.publicApi));
proxyRouter.use("/api/v1",     createResilientProxy("publicApi", SERVICES.publicApi));

// Notification Service
proxyRouter.use("/api/notifications", createResilientProxy("notification", SERVICES.notification));
proxyRouter.use("/api/notification-preferences", createResilientProxy("notification", SERVICES.notification));

// HR Service
proxyRouter.use("/api/employees", createResilientProxy("hr", SERVICES.hr));
proxyRouter.use("/api/hr", createResilientProxy("hr", SERVICES.hr));
proxyRouter.use("/api/time-tracking", createResilientProxy("hr", SERVICES.hr));
proxyRouter.use("/api/payroll-hr", createResilientProxy("hr", SERVICES.hr));

// Project Service
proxyRouter.use("/api/projects", createResilientProxy("project", SERVICES.project));
proxyRouter.use("/api/kanban", createResilientProxy("project", SERVICES.project));
proxyRouter.use("/api/tasks", createResilientProxy("project", SERVICES.project));
proxyRouter.use("/api/portfolio", createResilientProxy("project", SERVICES.project));
proxyRouter.use("/api/cms", createResilientProxy("project", SERVICES.project));

// POS Service
proxyRouter.use("/api/v1/pos", createResilientProxy("pos", SERVICES.pos));
proxyRouter.use("/api/pos", createResilientProxy("pos", SERVICES.pos));

// Affiliate Service
proxyRouter.use("/r", createResilientProxy("affiliate", SERVICES.affiliate));
proxyRouter.use("/api/affiliates", createResilientProxy("affiliate", SERVICES.affiliate));

// Payment Service (Decoupled Microservice)
proxyRouter.use("/api/v1/payments", createResilientProxy("payment", SERVICES.payment));
proxyRouter.use("/api/payments", createResilientProxy("payment", SERVICES.payment));

// Real-time Chat Microservice
proxyRouter.use("/api/v1/chat", createResilientProxy("chat", SERVICES.chat));
proxyRouter.use("/api/chat", createResilientProxy("chat", SERVICES.chat));

// Enterprise Feed Microservice
proxyRouter.use("/api/v1/feed", createResilientProxy("feed", SERVICES.feed));
proxyRouter.use("/api/feed", createResilientProxy("feed", SERVICES.feed));

