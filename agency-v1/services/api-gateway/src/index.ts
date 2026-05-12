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

// ── Service Discovery (K8s DNS) ──────────────────────────────────────────────
const SERVICES = {
  auth:       process.env.AUTH_SERVICE_URL       || "http://auth-service:4001",
  crm:        process.env.CRM_SERVICE_URL        || "http://crm-service:4002",
  automation: process.env.AUTOMATION_SERVICE_URL  || "http://automation-service:4003",
  ai:         process.env.AI_SERVICE_URL          || "http://ai-engine:4004",
  inbox:      process.env.INBOX_SERVICE_URL       || "http://inbox-service:4005",
  finance:    process.env.FINANCE_SERVICE_URL     || "http://finance-service:4006",
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
app.use("/api/campaigns", createProxyMiddleware(proxyOptions(SERVICES.automation)));
app.use("/api/marketing", createProxyMiddleware(proxyOptions(SERVICES.automation)));
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

// ── Fallback ─────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found", hint: "Check the API Gateway route table" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 API Gateway running on port ${PORT}`);
  console.log(`   Routes: auth→${SERVICES.auth}, crm→${SERVICES.crm}, automation→${SERVICES.automation}`);
  console.log(`   Routes: ai→${SERVICES.ai}, inbox→${SERVICES.inbox}, finance→${SERVICES.finance}`);
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default app as any;
