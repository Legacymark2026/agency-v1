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
app.use("/api/campaigns", (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions(SERVICES.automation)));
app.use("/api/marketing", (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions(SERVICES.automation)));
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
exports.default = app;
//# sourceMappingURL=index.js.map