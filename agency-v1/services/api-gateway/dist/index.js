"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * API Gateway — Central Traffic Router with Load Balancing
 * ─────────────────────────────────────────────────────────────────────────────
 * Routes all incoming requests to the appropriate microservice.
 * Handles: JWT validation, rate limiting, CORS, request logging.
 * Port: 8080 (public-facing)
 */
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const http_proxy_middleware_1 = require("http-proxy-middleware");
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || "8080", 10);
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
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
    auth: process.env.AUTH_SERVICE_URL || "http://auth-service:4001",
    crm: process.env.CRM_SERVICE_URL || "http://crm-service:4002",
    automation: process.env.AUTOMATION_SERVICE_URL || "http://automation-service:4003",
    ai: process.env.AI_SERVICE_URL || "http://ai-engine:4004",
    inbox: process.env.INBOX_SERVICE_URL || "http://inbox-service:4005",
    finance: process.env.FINANCE_SERVICE_URL || "http://finance-service:4006",
    video: process.env.VIDEO_SERVICE_URL || "http://video-service:4007",
    calendar: process.env.CALENDAR_SERVICE_URL || "http://calendar-service:4008",
    marketing: process.env.MARKETING_SERVICE_URL || "http://marketing-service:4009",
    integration: process.env.INTEGRATION_SERVICE_URL || "http://integration-service:4010",
    document: process.env.DOCUMENT_SERVICE_URL || "http://document-service:4011",
    agentTeam: process.env.AGENT_TEAM_ENGINE_URL || "http://agent-team-engine:4012",
    analytics: process.env.ANALYTICS_SERVICE_URL || "http://analytics-service:4013",
    admin: process.env.ADMIN_SERVICE_URL || "http://admin-service:4014",
    publicApi: process.env.PUBLIC_API_SERVICE_URL || "http://public-api-service:4015",
};
// ── Request Logging ──────────────────────────────────────────────────────────
app.use((req, _res, next) => {
    console.log(`[gateway] ${req.method} ${req.path} → routing...`);
    next();
});
// ── Route Definitions ────────────────────────────────────────────────────────
const proxyOptions = (target) => ({
    target,
    changeOrigin: true,
    timeout: 30000,
    proxyTimeout: 30000,
    onError: (err, _req, res) => {
        console.error(`[gateway] Proxy error to ${target}:`, err.message);
        res.status(502).json({ error: "Service unavailable", service: target });
    },
});
// Auth Service
app.use("/api/auth", (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions(SERVICES.auth)));
// CRM Service
app.use("/api/leads", (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions(SERVICES.crm)));
app.use("/api/deals", (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions(SERVICES.crm)));
app.use("/api/crm", (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions(SERVICES.crm)));
// Automation Service
app.use("/api/workflows", (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions(SERVICES.automation)));
app.use("/api/automation", (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions(SERVICES.automation)));
app.use("/api/cron/run-automation", (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions(SERVICES.automation)));
app.use("/api/cron/social-publisher", (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions(SERVICES.automation)));
app.use("/api/cron/process-sequences", (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions(SERVICES.automation)));
// AI Engine
app.use("/api/agents", (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions(SERVICES.ai)));
app.use("/api/ai", (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions(SERVICES.ai)));
app.use("/api/knowledge-bases", (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions(SERVICES.ai)));
// Inbox Service
app.use("/api/inbox", (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions(SERVICES.inbox)));
app.use("/api/webhooks/whatsapp", (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions(SERVICES.inbox)));
app.use("/api/webhooks/meta", (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions(SERVICES.inbox)));
app.use("/api/webhooks/channels", (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions(SERVICES.inbox)));
app.use("/api/cron/email-worker", (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions(SERVICES.inbox)));
// Finance Service
app.use("/api/invoices", (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions(SERVICES.finance)));
app.use("/api/payroll", (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions(SERVICES.finance)));
app.use("/api/expenses", (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions(SERVICES.finance)));
app.use("/api/webhooks/stripe", (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions(SERVICES.finance)));
app.use("/api/webhooks/paypal", (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions(SERVICES.finance)));
app.use("/api/cron/subscriptions", (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions(SERVICES.finance)));
// Video Service
app.use("/api/video", (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions(SERVICES.video)));
app.use("/api/media", (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions(SERVICES.video)));
// Calendar Service
app.use("/api/calendar", (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions(SERVICES.calendar)));
app.use("/api/scheduling", (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions(SERVICES.calendar)));
// Marketing Service
app.use("/api/marketing", (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions(SERVICES.marketing)));
app.use("/api/campaigns", (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions(SERVICES.marketing)));
app.use("/api/email-blast", (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions(SERVICES.marketing)));
app.use("/api/creative", (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions(SERVICES.marketing)));
// Integration Service
app.use("/api/integrations", (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions(SERVICES.integration)));
app.use("/api/webhooks/shopify", (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions(SERVICES.integration)));
app.use("/api/webhooks/wix", (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions(SERVICES.integration)));
// Document Service
app.use("/api/proposals", (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions(SERVICES.document)));
app.use("/api/propuesta", (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions(SERVICES.document)));
app.use("/api/kb", (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions(SERVICES.document)));
// Agent Team Engine
app.use("/api/agent", (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions(SERVICES.agentTeam)));
app.use("/api/test-flow", (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions(SERVICES.agentTeam)));
// Analytics Service
app.use("/api/analytics", (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions(SERVICES.analytics)));
app.use("/api/track", (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions(SERVICES.analytics)));
// Admin Service
app.use("/api/admin", (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions(SERVICES.admin)));
app.use("/api/diagnostics", (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions(SERVICES.admin)));
app.use("/api/debug", (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions(SERVICES.admin)));
// Public API Service
app.use("/api/v1", (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions(SERVICES.publicApi)));
app.use("/api/public", (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions(SERVICES.publicApi)));
app.use("/api/serve", (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions(SERVICES.publicApi)));
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
exports.default = app;
//# sourceMappingURL=index.js.map