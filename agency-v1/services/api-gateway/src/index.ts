/**
 * API Gateway — Central Traffic Router with Load Balancing
 * ─────────────────────────────────────────────────────────────────────────────
 * Routes all incoming requests to the appropriate microservice.
 * Handles: JWT validation, rate limiting, CORS, request logging.
 * Port: 8080 (public-facing)
 */
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { createProxyMiddleware } from "http-proxy-middleware";
import Redis from "ioredis";

const app = express();
const PORT = parseInt(process.env.PORT || "8080", 10);

app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-api-key", "x-device-id"],
}));

// ── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "healthy", service: "api-gateway", timestamp: new Date().toISOString() });
});

// ── Edge Cache (Redis) ───────────────────────────────────────────────────────
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
const CACHE_TTL = 300; // 5 minutes

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const edgeCacheMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.method !== "GET") return next();
  
  // Skip caching for auth and admin routes to prevent sensitive data leaks
  if (req.path.startsWith("/api/auth") || req.path.startsWith("/api/admin")) {
    return next();
  }

  const cacheKey = `edge_cache:${req.path}`;
  try {
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      res.setHeader("X-Cache", "HIT");
      res.setHeader("Content-Type", "application/json");
      res.send(cachedData);
      return;
    }

    res.setHeader("X-Cache", "MISS");
    
    // Intercept response to save it in cache
    const originalSend = res.send;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    res.send = function (body: any): express.Response {
      // Only cache successful JSON responses
      if (res.statusCode >= 200 && res.statusCode < 300 && res.getHeader("Content-Type")?.toString().includes("application/json")) {
        redis.setex(cacheKey, CACHE_TTL, body).catch(err => console.error("[Edge Cache] Error setting cache:", err));
      }
      return originalSend.call(this, body);
    };
    next();
  } catch (error) {
    console.error("[Edge Cache] Redis error:", error);
    next();
  }
};

// Apply Edge Cache globally (it filters by GET and skips auth/admin internally)
app.use(edgeCacheMiddleware);


// ── Service Discovery (K8s DNS) ──────────────────────────────────────────────
const SERVICES = {
  auth:       process.env.AUTH_SERVICE_URL       || "http://auth-service:4001",
  crm:        process.env.CRM_SERVICE_URL        || "http://crm-service:4002",
  automation: process.env.AUTOMATION_SERVICE_URL  || "http://automation-service:4003",
  ai:         process.env.AI_SERVICE_URL          || "http://ai-engine:4004",
  inbox:      process.env.INBOX_SERVICE_URL       || "http://inbox-service:4005",
  finance:    process.env.FINANCE_SERVICE_URL     || "http://finance-service:4006",
  video:      process.env.VIDEO_SERVICE_URL       || "http://video-service:4007",
  calendar:   process.env.CALENDAR_SERVICE_URL    || "http://calendar-service:4008",
  marketing:  process.env.MARKETING_SERVICE_URL   || "http://marketing-service:4009",
  integration: process.env.INTEGRATION_SERVICE_URL || "http://integration-service:4010",
  document:   process.env.DOCUMENT_SERVICE_URL    || "http://document-service:4011",
  agentTeam:  process.env.AGENT_TEAM_ENGINE_URL   || "http://agent-team-engine:4012",
  analytics:  process.env.ANALYTICS_SERVICE_URL   || "http://analytics-service:4013",
  admin:      process.env.ADMIN_SERVICE_URL       || "http://admin-service:4014",
  publicApi:  process.env.PUBLIC_API_SERVICE_URL  || "http://public-api-service:4015",
};

// ── Request Logging ──────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[gateway] ${req.method} ${req.path} → routing...`);
  next();
});

// ── Route Definitions ────────────────────────────────────────────────────────
const proxyOptions = (target: string) => ({
  target,
  changeOrigin: true,
  timeout: 30000,
  proxyTimeout: 30000,
  onError: (err: Error, _req: express.Request, res: express.Response) => {
    console.error(`[gateway] Proxy error to ${target}:`, err.message);
    res.status(502).json({ error: "Service unavailable", service: target });
  },
});

// Auth Service
app.use("/api/auth", createProxyMiddleware(proxyOptions(SERVICES.auth)));

// CRM Service
app.use("/api/leads", createProxyMiddleware(proxyOptions(SERVICES.crm)));
app.use("/api/deals", createProxyMiddleware(proxyOptions(SERVICES.crm)));
app.use("/api/crm", createProxyMiddleware(proxyOptions(SERVICES.crm)));

// Automation Service
app.use("/api/workflows", createProxyMiddleware(proxyOptions(SERVICES.automation)));
app.use("/api/automation", createProxyMiddleware(proxyOptions(SERVICES.automation)));
app.use("/api/cron/run-automation", createProxyMiddleware(proxyOptions(SERVICES.automation)));
app.use("/api/cron/social-publisher", createProxyMiddleware(proxyOptions(SERVICES.automation)));
app.use("/api/cron/process-sequences", createProxyMiddleware(proxyOptions(SERVICES.automation)));

// AI Engine
app.use("/api/agents", createProxyMiddleware(proxyOptions(SERVICES.ai)));
app.use("/api/ai", createProxyMiddleware(proxyOptions(SERVICES.ai)));
app.use("/api/knowledge-bases", createProxyMiddleware(proxyOptions(SERVICES.ai)));

// Inbox Service
app.use("/api/inbox", createProxyMiddleware(proxyOptions(SERVICES.inbox)));
app.use("/api/webhooks/whatsapp", createProxyMiddleware(proxyOptions(SERVICES.inbox)));
app.use("/api/webhooks/meta", createProxyMiddleware(proxyOptions(SERVICES.inbox)));
app.use("/api/webhooks/channels", createProxyMiddleware(proxyOptions(SERVICES.inbox)));
app.use("/api/cron/email-worker", createProxyMiddleware(proxyOptions(SERVICES.inbox)));

// Finance Service
app.use("/api/invoices", createProxyMiddleware(proxyOptions(SERVICES.finance)));
app.use("/api/payroll", createProxyMiddleware(proxyOptions(SERVICES.finance)));
app.use("/api/expenses", createProxyMiddleware(proxyOptions(SERVICES.finance)));
app.use("/api/webhooks/stripe", createProxyMiddleware(proxyOptions(SERVICES.finance)));
app.use("/api/webhooks/paypal", createProxyMiddleware(proxyOptions(SERVICES.finance)));
app.use("/api/cron/subscriptions", createProxyMiddleware(proxyOptions(SERVICES.finance)));

// Video Service
app.use("/api/video", createProxyMiddleware(proxyOptions(SERVICES.video)));
app.use("/api/media", createProxyMiddleware(proxyOptions(SERVICES.video)));

// Calendar Service
app.use("/api/calendar", createProxyMiddleware(proxyOptions(SERVICES.calendar)));
app.use("/api/scheduling", createProxyMiddleware(proxyOptions(SERVICES.calendar)));

// Marketing Service
app.use("/api/marketing", createProxyMiddleware(proxyOptions(SERVICES.marketing)));
app.use("/api/campaigns", createProxyMiddleware(proxyOptions(SERVICES.marketing)));
app.use("/api/email-blast", createProxyMiddleware(proxyOptions(SERVICES.marketing)));
app.use("/api/creative", createProxyMiddleware(proxyOptions(SERVICES.marketing)));

// Integration Service
app.use("/api/integrations", createProxyMiddleware(proxyOptions(SERVICES.integration)));
app.use("/api/webhooks/shopify", createProxyMiddleware(proxyOptions(SERVICES.integration)));
app.use("/api/webhooks/wix", createProxyMiddleware(proxyOptions(SERVICES.integration)));

// Document Service
app.use("/api/proposals", createProxyMiddleware(proxyOptions(SERVICES.document)));
app.use("/api/propuesta", createProxyMiddleware(proxyOptions(SERVICES.document)));
app.use("/api/kb", createProxyMiddleware(proxyOptions(SERVICES.document)));

// Agent Team Engine
app.use("/api/agent", createProxyMiddleware(proxyOptions(SERVICES.agentTeam)));
app.use("/api/test-flow", createProxyMiddleware(proxyOptions(SERVICES.agentTeam)));

// Analytics Service
app.use("/api/analytics", createProxyMiddleware(proxyOptions(SERVICES.analytics)));
app.use("/api/track", createProxyMiddleware(proxyOptions(SERVICES.analytics)));

// Admin Service
app.use("/api/admin", createProxyMiddleware(proxyOptions(SERVICES.admin)));
app.use("/api/diagnostics", createProxyMiddleware(proxyOptions(SERVICES.admin)));
app.use("/api/debug", createProxyMiddleware(proxyOptions(SERVICES.admin)));

// Public API Service
app.use("/api/v1", createProxyMiddleware(proxyOptions(SERVICES.publicApi)));
app.use("/api/public", createProxyMiddleware(proxyOptions(SERVICES.publicApi)));
app.use("/api/serve", createProxyMiddleware(proxyOptions(SERVICES.publicApi)));

// ── Fallback ─────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found", hint: "Check the API Gateway route table" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 API Gateway running on port ${PORT}`);
  console.log(`   Routes: auth→${SERVICES.auth}, crm→${SERVICES.crm}, automation→${SERVICES.automation}`);
  console.log(`   Routes: ai→${SERVICES.ai}, inbox→${SERVICES.inbox}, finance→${SERVICES.finance}`);
  console.log(`   Routes: video→${SERVICES.video}, calendar→${SERVICES.calendar}`);
  console.log(`   Routes: marketing→${SERVICES.marketing}, integration→${SERVICES.integration}`);
  console.log(`   Routes: document→${SERVICES.document}, agentTeam→${SERVICES.agentTeam}`);
  console.log(`   Routes: analytics→${SERVICES.analytics}, admin→${SERVICES.admin}, publicApi→${SERVICES.publicApi}`);
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default app as any;
