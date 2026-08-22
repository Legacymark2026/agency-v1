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
// Observability registration — must be first
try {
    require("@agency/observability/register");
}
catch { /* observability optional */ }
const observability_1 = require("@agency/observability");
const express_1 = __importDefault(require("express"));
const service_auth_1 = require("@agency/service-auth");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const http_proxy_middleware_1 = require("http-proxy-middleware");
const ioredis_1 = __importDefault(require("ioredis"));
const server_1 = require("@apollo/server");
const express4_1 = require("@apollo/server/express4");
const crypto_1 = __importDefault(require("crypto"));
const grpc_1 = require("@agency/grpc");
const AUTH_GRPC_URL = process.env.AUTH_GRPC_URL || "auth-service:50051";
const authGrpcClient = grpc_1.GrpcClientHelper.getClient("auth-service", grpc_1.PROTO_PATHS.auth, "auth", "AuthService", AUTH_GRPC_URL, { failureThreshold: 3, resetTimeoutMs: 5000, timeoutMs: 3000 });
const CRM_GRPC_URL = process.env.CRM_GRPC_URL || "crm-service:50052";
const crmGrpcClient = grpc_1.GrpcClientHelper.getClient("crm-service", grpc_1.PROTO_PATHS.crm, "crm", "CrmService", CRM_GRPC_URL, { failureThreshold: 3, resetTimeoutMs: 5000, timeoutMs: 3000 });
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || "8080", 10);
app.use((0, observability_1.metricsMiddleware)("api-gateway"));
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-api-key", "x-device-id", "x-correlation-id"],
    exposedHeaders: ["x-correlation-id"],
}));
// ── Correlation ID Middleware ────────────────────────────────────────────────
app.use((req, res, next) => {
    const correlationId = (req.headers["x-correlation-id"] || req.headers["correlation-id"] || crypto_1.default.randomUUID());
    req.headers["x-correlation-id"] = correlationId;
    res.setHeader("x-correlation-id", correlationId);
    next();
});
// ── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
    res.json({ status: "healthy", service: "api-gateway", timestamp: new Date().toISOString() });
});
app.get("/metrics", observability_1.metricsEndpoint);
// ── Layered Router (Controller -> Service -> Middleware) ──────────────────────
const gateway_routes_1 = require("./routes/gateway.routes");
const gateway_middleware_1 = require("./middlewares/gateway.middleware");
app.use("/api/v1", gateway_routes_1.gatewayRouter);
app.use(gateway_middleware_1.errorHandler);
app.post("/api/gateway/verify-token", express_1.default.json(), async (req, res) => {
    const { token } = req.body;
    if (!token)
        return res.status(400).json({ valid: false, error: "Token required" });
    try {
        const result = await authGrpcClient.call("ValidateToken", { token }, async () => {
            // Fallback: HTTP call if gRPC fails or circuit is open
            const authUrl = await resolveServiceUrl("auth");
            const resp = await fetch(`${authUrl}/api/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await resp.json();
            return {
                valid: resp.ok,
                userId: data.user?.id || "",
                email: data.user?.email || "",
                role: data.user?.role || "",
                companyId: "",
                error: resp.ok ? "" : (data.error || "HTTP verification failed")
            };
        });
        res.json(result);
    }
    catch (err) {
        res.status(500).json({ valid: false, error: err.message });
    }
});
// ── Edge Cache & Service Registry (Redis) ───────────────────────────────────
const redis = new ioredis_1.default(process.env.REDIS_URL || "redis://localhost:6379");
redis.on("error", (err) => console.error("[api-gateway] Redis global error:", err.message));
const CACHE_TTL = 300; // 5 minutes
// ── Redis-Backed Rate Limiting Middleware ────────────────────────────────────
const rateLimitMiddleware = async (req, res, next) => {
    if (req.path === "/health")
        return next();
    const clientIp = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "anonymous");
    const rateLimitKey = `rate_limit:${clientIp}:${req.path}`;
    try {
        const limit = 100; // max 100 requests
        const windowSeconds = 60; // per 60 seconds
        const current = await redis.incr(rateLimitKey);
        if (current === 1) {
            await redis.expire(rateLimitKey, windowSeconds);
        }
        res.setHeader("X-RateLimit-Limit", limit);
        res.setHeader("X-RateLimit-Remaining", Math.max(0, limit - current));
        if (current > limit) {
            res.setHeader("Retry-After", windowSeconds);
            res.status(429).json({
                error: "Too many requests",
                message: `Rate limit exceeded. Maximum ${limit} requests per minute.`,
                retryAfterSeconds: windowSeconds
            });
            return;
        }
        next();
    }
    catch (err) {
        // H-5 FIX: Fail-closed with in-memory fallback when Redis is down
        console.error(`[RateLimiter] Redis error for IP ${clientIp}: ${err.message}. Applying in-memory fallback.`);
        // Emergency in-memory counter (basic DoS protection when Redis fails)
        const memKey = `${clientIp}:${req.path}`;
        const memCount = (inMemoryRateLimits.get(memKey) || 0) + 1;
        inMemoryRateLimits.set(memKey, memCount);
        if (memCount > 200) { // Higher threshold since in-memory is per-instance
            return res.status(429).json({ error: "Too many requests (fallback)" });
        }
        next();
    }
};
// In-memory fallback rate limit counters (reset every 60s)
const inMemoryRateLimits = new Map();
setInterval(() => inMemoryRateLimits.clear(), 60_000);
app.use(rateLimitMiddleware);
// ── Metered Usage & Monetization Middleware ─────────────────────────────────
const DEFAULT_API_COST_TABLE = {
    "/api/v1/agents": { unitType: "TOKENS", costPerUnitUsd: 0.0000025 }, // $0.0025 per 1k tokens
    "/api/v1/video": { unitType: "SECONDS", costPerUnitUsd: 0.05 }, // $0.05 per sec
    "/api/v1/invoices": { unitType: "DOCUMENTS", costPerUnitUsd: 0.08 }, // $0.08 per invoice
    "default": { unitType: "REQUESTS", costPerUnitUsd: 0.0005 }, // $0.0005 per request
};
let activeApiCostTable = { ...DEFAULT_API_COST_TABLE };
// Carga inicial de Redis si existe
redis.get("config:api_pricing").then((cached) => {
    if (cached) {
        try {
            activeApiCostTable = { ...DEFAULT_API_COST_TABLE, ...JSON.parse(cached) };
        }
        catch { }
    }
}).catch(() => { });
// H-6 FIX: Protect admin pricing endpoints with internal auth check
const requireAdminGateway = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Authentication required" });
    }
    try {
        const result = await authGrpcClient.call("ValidateToken", { token: authHeader.slice(7) }, async () => {
            return { valid: false, role: "", error: "gRPC unavailable" };
        });
        if (!result.valid || (result.role !== "super_admin" && result.role !== "admin")) {
            return res.status(403).json({ error: "Admin access required" });
        }
        next();
    }
    catch {
        return res.status(401).json({ error: "Authentication failed" });
    }
};
app.get("/api/v1/admin/pricing", requireAdminGateway, async (req, res) => {
    try {
        const cached = await redis.get("config:api_pricing");
        const pricing = cached ? JSON.parse(cached) : activeApiCostTable;
        res.json({ success: true, pricing });
    }
    catch (err) {
        res.json({ success: true, pricing: activeApiCostTable });
    }
});
app.post("/api/v1/admin/pricing", requireAdminGateway, async (req, res) => {
    try {
        const { pricing } = req.body;
        if (!pricing || typeof pricing !== "object") {
            return res.status(400).json({ success: false, error: "Objeto de tarifario inválido" });
        }
        activeApiCostTable = { ...DEFAULT_API_COST_TABLE, ...pricing };
        await redis.set("config:api_pricing", JSON.stringify(activeApiCostTable));
        res.json({ success: true, message: "Tarifario actualizado en tiempo real en todo el clúster", pricing: activeApiCostTable });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
const apiUsageMeteringMiddleware = async (req, res, next) => {
    if (!req.path.startsWith("/api/v1") && !req.path.startsWith("/api/agents"))
        return next();
    const startTime = Date.now();
    res.on("finish", async () => {
        try {
            const companyId = (req.headers["x-company-id"] || "company-default");
            const apiKeyId = (req.headers["x-api-key-id"] || "public-api");
            const durationMs = Date.now() - startTime;
            let matchedConfig = activeApiCostTable["default"];
            for (const prefix of Object.keys(activeApiCostTable)) {
                if (prefix !== "default" && req.path.startsWith(prefix)) {
                    matchedConfig = activeApiCostTable[prefix];
                    break;
                }
            }
            const unitsHeader = res.getHeader("x-units-consumed");
            const unitsConsumed = unitsHeader ? parseFloat(String(unitsHeader)) : 1.0;
            const totalCostUsd = unitsConsumed * matchedConfig.costPerUnitUsd;
            const eventPayload = {
                companyId,
                apiKeyId,
                serviceName: req.path.split("/")[2] || "core",
                endpoint: req.path,
                method: req.method,
                statusCode: String(res.statusCode),
                durationMs: String(durationMs),
                requestBytes: String(req.headers["content-length"] || 0),
                responseBytes: String(res.getHeader("content-length") || 0),
                unitsConsumed: String(unitsConsumed),
                unitType: matchedConfig.unitType,
                totalCostUsd: String(totalCostUsd),
                timestamp: new Date().toISOString(),
            };
            await redis.xadd("api_usage_stream", "*", ...Object.entries(eventPayload).flat());
        }
        catch (err) {
            console.warn("[Metering] Redis Stream push error:", err.message);
        }
    });
    next();
};
app.use(apiUsageMeteringMiddleware);
// ── Service Discovery Config ─────────────────────────────────────────────────
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
    notification: process.env.NOTIFICATION_SERVICE_URL || "http://notification-service:4016",
    hr: process.env.HR_SERVICE_URL || "http://hr-service:4017",
    project: process.env.PROJECT_SERVICE_URL || "http://project-service:4018",
    affiliate: process.env.AFFILIATE_SERVICE_URL || "http://affiliate-service:4019",
    pos: process.env.POS_SERVICE_URL || "http://pos-service:4020",
};
// Dynamic Service Discovery Helper
const resolveServiceUrl = async (serviceName) => {
    try {
        const dynamicUrl = await redis.get(`service_registry:${serviceName}`);
        if (dynamicUrl) {
            console.log(`[ServiceDiscovery] Resolved ${serviceName} dynamically to ${dynamicUrl}`);
            return dynamicUrl;
        }
    }
    catch (err) {
        console.error(`[ServiceDiscovery] Error reading registry for ${serviceName}:`, err.message);
    }
    return SERVICES[serviceName];
};
// ── V3 Supergraph (GraphQL Federated Composition) ───────────────────────────
const typeDefs = `#graphql
  type User { id: ID!, name: String, email: String, leads: [Lead] }
  type Lead { id: ID!, name: String, status: String }
  type Query {
    me: User
    platformStats: String
  }
`;
const resolvers = {
    Query: {
        me: async (_parent, _args, context) => {
            if (!context.token)
                throw new Error("Unauthorized");
            try {
                const serviceUrl = await resolveServiceUrl("auth");
                const response = await fetch(`${serviceUrl}/api/auth/me`, {
                    headers: {
                        "Authorization": context.token,
                        "x-correlation-id": String(context.correlationId || "")
                    }
                });
                const body = await response.json();
                if (!response.ok)
                    throw new Error(body.error || "Failed to fetch current user");
                return body.user;
            }
            catch (err) {
                console.error(`[Trace: ${context.correlationId}] GraphQL error resolving Query.me:`, err.message);
                throw err;
            }
        },
        platformStats: () => "V3 Supergraph Active with REST-Composition",
    },
    User: {
        leads: async (user, _args, context) => {
            if (!context.token)
                return [];
            try {
                // M-7 FIX: Verify JWT via gRPC instead of decoding without signature check
                const tokenStr = context.token.replace("Bearer ", "");
                if (!tokenStr)
                    return [];
                let companyId = null;
                try {
                    const tokenResult = await authGrpcClient.call("ValidateToken", { token: tokenStr }, async () => {
                        return { valid: false, companyId: "" };
                    });
                    if (!tokenResult.valid)
                        return [];
                    companyId = tokenResult.companyId;
                }
                catch {
                    return [];
                }
                if (!companyId)
                    return [];
                const serviceUrl = await resolveServiceUrl("crm");
                const url = `${serviceUrl}/api/leads?companyId=${companyId}&syncEmail=${user.email}`;
                const response = await fetch(url, {
                    headers: {
                        "Authorization": context.token,
                        "x-correlation-id": String(context.correlationId || "")
                    }
                });
                const body = await response.json();
                if (!response.ok)
                    return [];
                return body.leads || [];
            }
            catch (err) {
                console.error(`[Trace: ${context.correlationId}] GraphQL error resolving User.leads:`, err.message);
                return [];
            }
        }
    }
};
class RedisKeyValueCache {
    client;
    constructor(redisUrl) {
        this.client = new ioredis_1.default(redisUrl, {
            maxRetriesPerRequest: 3,
            retryStrategy(times) {
                return Math.min(times * 100, 3000);
            }
        });
        this.client.on("error", (err) => console.error("[api-gateway] RedisKeyValueCache error:", err.message));
    }
    async get(key) {
        const val = await this.client.get(key);
        return val === null ? undefined : val;
    }
    async set(key, value, options) {
        if (options?.ttl) {
            await this.client.set(key, value, "EX", options.ttl);
        }
        else {
            await this.client.set(key, value);
        }
    }
    async delete(key) {
        await this.client.del(key);
    }
}
const apolloServer = new server_1.ApolloServer({
    typeDefs,
    resolvers,
    cache: new RedisKeyValueCache(process.env.REDIS_URL || "redis://redis:6379")
});
// Start Apollo Server asynchronously
(async () => {
    await apolloServer.start();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    app.use("/graphql", express_1.default.json(), (0, express4_1.expressMiddleware)(apolloServer, {
        context: async ({ req }) => {
            const token = req.headers.authorization || "";
            const correlationId = (req.headers["x-correlation-id"] || crypto_1.default.randomUUID());
            return { token, correlationId };
        }
    }));
    console.log("🚀 V3 GraphQL Supergraph composition ready at /graphql");
})();
// ── Edge Cache Middleware ───────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const edgeCacheMiddleware = async (req, res, next) => {
    if (req.method !== "GET")
        return next();
    // Skip caching for auth and admin routes to prevent sensitive data leaks
    if (req.path.startsWith("/api/auth") || req.path.startsWith("/api/admin")) {
        return next();
    }
    // M-6 FIX: Include auth state in cache key to prevent cross-user cache leaks
    const authId = (req.headers.authorization || "anon").slice(0, 20);
    const cacheKey = `edge_cache:${authId}:${req.path}`;
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
        res.send = function (body) {
            // Only cache successful JSON responses
            if (res.statusCode >= 200 && res.statusCode < 300 && res.getHeader("Content-Type")?.toString().includes("application/json")) {
                redis.setex(cacheKey, CACHE_TTL, body).catch(err => console.error("[Edge Cache] Error setting cache:", err));
            }
            return originalSend.call(this, body);
        };
        next();
    }
    catch (error) {
        console.error("[Edge Cache] Redis error:", error);
        next();
    }
};
// Apply Edge Cache globally (it filters by GET and skips auth/admin internally)
app.use(edgeCacheMiddleware);
// ── Request Logging with Tracing ─────────────────────────────────────────────
app.use((req, _res, next) => {
    const correlationId = req.headers["x-correlation-id"];
    console.log(`[Trace: ${correlationId}] [gateway] ${req.method} ${req.path} → routing...`);
    next();
});
// ── Route Definitions ────────────────────────────────────────────────────────
// ── Circuit Breaker Implementation ───────────────────────────────────────────
class CircuitBreaker {
    serviceName;
    state = "CLOSED";
    failureCount = 0;
    halfOpenFailures = 0;
    lastStateChange = Date.now();
    failureThreshold = 25;
    cooldownPeriod = 3000; // 3 seconds
    constructor(serviceName) {
        this.serviceName = serviceName;
    }
    checkState() {
        if (this.state === "OPEN" && Date.now() - this.lastStateChange > this.cooldownPeriod) {
            this.state = "HALF-OPEN";
            this.halfOpenFailures = 0;
            this.lastStateChange = Date.now();
            console.log(`[CircuitBreaker] Circuit transitioned to HALF-OPEN for ${this.serviceName}`);
        }
    }
    recordSuccess() {
        this.failureCount = 0;
        this.halfOpenFailures = 0;
        if (this.state === "HALF-OPEN" || this.state === "OPEN") {
            this.state = "CLOSED";
            this.lastStateChange = Date.now();
            console.log(`[CircuitBreaker] Circuit transitioned to CLOSED for ${this.serviceName}`);
        }
    }
    recordFailure() {
        this.failureCount++;
        this.lastStateChange = Date.now();
        if (this.state === "HALF-OPEN") {
            this.halfOpenFailures++;
            if (this.halfOpenFailures >= 3) {
                this.state = "OPEN";
                console.warn(`[CircuitBreaker] Circuit transitioned back to OPEN for ${this.serviceName}`);
            }
        }
        else if (this.failureCount >= this.failureThreshold) {
            this.state = "OPEN";
            console.warn(`[CircuitBreaker] Circuit transitioned to OPEN for ${this.serviceName} due to failures (${this.failureCount})`);
        }
    }
}
const breakers = {};
const getBreaker = (serviceName) => {
    if (!breakers[serviceName]) {
        breakers[serviceName] = new CircuitBreaker(serviceName);
    }
    return breakers[serviceName];
};
const handleFallback = async (req, res, serviceName, reason) => {
    if (req.method === "GET") {
        // Try to get from Redis cache
        const authId = (req.headers.authorization || "anon").slice(0, 20);
        const cacheKey = `edge_cache:${authId}:${req.path}`;
        try {
            const cachedData = await redis.get(cacheKey);
            if (cachedData) {
                res.setHeader("X-Cache-Fallback", "HIT");
                res.setHeader("Content-Type", "application/json");
                res.status(200).send(cachedData);
                return;
            }
        }
        catch (cacheErr) {
            console.error(`[CircuitBreaker] Fallback cache read error for ${serviceName}:`, cacheErr);
        }
    }
    res.status(503).json({
        error: "Service temporarily degraded",
        service: serviceName,
        reason,
        timestamp: new Date().toISOString()
    });
};
const resilientProxy = (serviceName, target) => {
    const breaker = getBreaker(serviceName);
    const proxy = (0, http_proxy_middleware_1.createProxyMiddleware)({
        target,
        router: async () => {
            return await resolveServiceUrl(serviceName);
        },
        changeOrigin: true,
        on: {
            proxyReq: (proxyReq, req) => {
                if (req.headers["x-correlation-id"]) {
                    proxyReq.setHeader("x-correlation-id", req.headers["x-correlation-id"]);
                }
                // Remove client-supplied identity headers to prevent header spoofing
                proxyReq.removeHeader("x-user-id");
                proxyReq.removeHeader("x-company-id");
                // C-5 FIX: Verify JWT signature via gRPC before injecting identity headers
                const token = req.headers.authorization || req.headers.Authorization;
                if (token && token.startsWith("Bearer ")) {
                    const rawToken = token.slice(7);
                    (async () => {
                        try {
                            // Fast path: verify token via gRPC with circuit breaker + fallback
                            const result = await authGrpcClient.call("ValidateToken", { token: rawToken }, async () => {
                                // Fallback: HTTP call to auth-service /api/auth/me
                                const authUrl = await resolveServiceUrl("auth");
                                const resp = await fetch(`${authUrl}/api/auth/me`, {
                                    headers: { Authorization: token }
                                });
                                if (!resp.ok)
                                    return { valid: false, userId: "", companyId: "" };
                                const data = await resp.json();
                                return { valid: true, userId: data.user?.id || "", companyId: "" };
                            });
                            if (result.valid && result.userId) {
                                proxyReq.setHeader("x-user-id", String(result.userId));
                                if (result.companyId) {
                                    proxyReq.setHeader("x-company-id", String(result.companyId));
                                }
                            }
                        }
                        catch (err) {
                            // If both gRPC and HTTP verification fail, do NOT inject headers
                        }
                    })();
                }
            },
            proxyRes: (proxyRes, req, res) => {
                if (proxyRes.statusCode && [502, 503, 504].includes(proxyRes.statusCode)) {
                    breaker.recordFailure();
                }
                else {
                    breaker.recordSuccess();
                }
            },
            error: async (err, req, res) => {
                const resolvedTarget = await resolveServiceUrl(serviceName);
                console.error(`[CircuitBreaker] Proxy error for ${serviceName} to ${resolvedTarget}:`, err.message);
                // Do not record permanent circuit breaker failure for transient Docker DNS lookup errors (EAI_AGAIN)
                if (err.code === 'EAI_AGAIN' || err.message?.includes('EAI_AGAIN')) {
                    console.warn(`[CircuitBreaker] Temporary Docker DNS lookup failure (EAI_AGAIN) for ${serviceName}. Waiting for container startup...`);
                }
                else {
                    breaker.recordFailure();
                }
                await handleFallback(req, res, serviceName, `Proxy error: ${err.message}`);
            }
        }
    });
    return async (req, res, next) => {
        breaker.checkState();
        if (breaker.state === "OPEN") {
            console.warn(`[CircuitBreaker] Short-circuiting request for ${serviceName} (Circuit is OPEN)`);
            return handleFallback(req, res, serviceName, "Circuit breaker is open");
        }
        // Express strips the mount prefix from req.url (e.g. app.use("/api/auth") → req.url = "/login").
        // Upstream services expect the full path (/api/auth/login), so we restore it from req.originalUrl.
        if (req.originalUrl && req.url !== req.originalUrl) {
            req.url = req.originalUrl;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return proxy(req, res, next);
    };
};
// ── Route Definitions ────────────────────────────────────────────────────────
// Auth Service
app.use("/api/auth", resilientProxy("auth", SERVICES.auth));
app.use("/api/v1/auth", resilientProxy("auth", SERVICES.auth));
// CRM Service
app.use("/api/leads", resilientProxy("crm", SERVICES.crm));
app.use("/api/deals", resilientProxy("crm", SERVICES.crm));
app.use("/api/crm", resilientProxy("crm", SERVICES.crm));
// Automation Service
app.use("/api/workflows", resilientProxy("automation", SERVICES.automation));
app.use("/api/automation", resilientProxy("automation", SERVICES.automation));
app.use("/api/cron/run-automation", resilientProxy("automation", SERVICES.automation));
app.use("/api/cron/social-publisher", resilientProxy("automation", SERVICES.automation));
app.use("/api/cron/process-sequences", resilientProxy("automation", SERVICES.automation));
// AI Engine
app.use("/api/agents", resilientProxy("ai", SERVICES.ai));
app.use("/api/v1/agents", resilientProxy("ai", SERVICES.ai));
app.use("/api/ai", resilientProxy("ai", SERVICES.ai));
app.use("/api/knowledge-bases", resilientProxy("ai", SERVICES.ai));
// Inbox Service
app.use("/api/inbox", resilientProxy("inbox", SERVICES.inbox));
app.use("/api/webhooks/whatsapp", resilientProxy("inbox", SERVICES.inbox));
app.use("/api/webhooks/meta", resilientProxy("inbox", SERVICES.inbox));
app.use("/api/webhooks/channels", resilientProxy("inbox", SERVICES.inbox));
app.use("/api/cron/email-worker", resilientProxy("inbox", SERVICES.inbox));
// Finance Service
app.use("/api/invoices", resilientProxy("finance", SERVICES.finance));
app.use("/api/payroll", resilientProxy("finance", SERVICES.finance));
app.use("/api/expenses", resilientProxy("finance", SERVICES.finance));
app.use("/api/webhooks/stripe", resilientProxy("finance", SERVICES.finance));
app.use("/api/webhooks/paypal", resilientProxy("finance", SERVICES.finance));
app.use("/api/cron/subscriptions", resilientProxy("finance", SERVICES.finance));
// Video Service
app.use("/api/video", resilientProxy("video", SERVICES.video));
app.use("/api/media", resilientProxy("video", SERVICES.video));
// Calendar Service
app.use("/api/calendar", resilientProxy("calendar", SERVICES.calendar));
app.use("/api/scheduling", resilientProxy("calendar", SERVICES.calendar));
// Marketing Service
app.use("/api/marketing", resilientProxy("marketing", SERVICES.marketing));
app.use("/api/campaigns", resilientProxy("marketing", SERVICES.marketing));
app.use("/api/email-blast", resilientProxy("marketing", SERVICES.marketing));
app.use("/api/creative", resilientProxy("marketing", SERVICES.marketing));
app.use("/api/email-templates", resilientProxy("marketing", SERVICES.marketing));
app.use("/api/mailing-lists", resilientProxy("marketing", SERVICES.marketing));
app.use("/api/suppression-lists", resilientProxy("marketing", SERVICES.marketing));
// Marketing Enterprise Features
app.use("/api/email-validation", resilientProxy("marketing", SERVICES.marketing));
app.use("/api/queue", resilientProxy("marketing", SERVICES.marketing));
app.use("/api/sequences", resilientProxy("marketing", SERVICES.marketing));
app.use("/api/domain-reputation", resilientProxy("marketing", SERVICES.marketing));
app.use("/api/reports", resilientProxy("marketing", SERVICES.marketing));
app.use("/api/segments", resilientProxy("marketing", SERVICES.marketing));
app.use("/api/templates", resilientProxy("marketing", SERVICES.marketing));
app.use("/api/compliance", resilientProxy("marketing", SERVICES.marketing));
// Integration Service
app.use("/api/integrations", resilientProxy("integration", SERVICES.integration));
app.use("/api/webhooks/shopify", resilientProxy("integration", SERVICES.integration));
app.use("/api/webhooks/wix", resilientProxy("integration", SERVICES.integration));
// Document Service
app.use("/api/proposals", resilientProxy("document", SERVICES.document));
app.use("/api/propuesta", resilientProxy("document", SERVICES.document));
app.use("/api/kb", resilientProxy("document", SERVICES.document));
// Agent Team Engine
app.use("/api/agent/teams", resilientProxy("agentTeam", SERVICES.agentTeam));
app.use("/api/agent/presets", resilientProxy("agentTeam", SERVICES.agentTeam));
app.use("/api/test-flow", resilientProxy("agentTeam", SERVICES.agentTeam));
// Analytics Service
app.use("/api/analytics", resilientProxy("analytics", SERVICES.analytics));
app.use("/api/track", resilientProxy("analytics", SERVICES.analytics));
// Admin Service
app.use("/api/admin", resilientProxy("admin", SERVICES.admin));
app.use("/api/diagnostics", resilientProxy("admin", SERVICES.admin));
app.use("/api/debug", resilientProxy("admin", SERVICES.admin));
// Specific /api/v1/* routes for versioned microservices (MUST come before catch-all below)
app.use("/api/v1/crm", resilientProxy("crm", SERVICES.crm));
app.use("/api/v1/leads", resilientProxy("crm", SERVICES.crm));
app.use("/api/v1/deals", resilientProxy("crm", SERVICES.crm));
app.use("/api/v1/inbox", resilientProxy("inbox", SERVICES.inbox));
app.use("/api/v1/invoices", resilientProxy("finance", SERVICES.finance));
app.use("/api/v1/payroll", resilientProxy("finance", SERVICES.finance));
app.use("/api/v1/marketing", resilientProxy("marketing", SERVICES.marketing));
app.use("/api/v1/campaigns", resilientProxy("marketing", SERVICES.marketing));
app.use("/api/v1/automation", resilientProxy("automation", SERVICES.automation));
app.use("/api/v1/workflows", resilientProxy("automation", SERVICES.automation));
app.use("/api/v1/notifications", resilientProxy("notification", SERVICES.notification));
app.use("/api/v1/employees", resilientProxy("hr", SERVICES.hr));
app.use("/api/v1/hr", resilientProxy("hr", SERVICES.hr));
app.use("/api/v1/projects", resilientProxy("project", SERVICES.project));
app.use("/api/v1/kanban", resilientProxy("project", SERVICES.project));
app.use("/api/v1/tasks", resilientProxy("project", SERVICES.project));
app.use("/api/v1/analytics", resilientProxy("analytics", SERVICES.analytics));
app.use("/api/v1/calendar", resilientProxy("calendar", SERVICES.calendar));
app.use("/api/v1/video", resilientProxy("video", SERVICES.video));
app.use("/api/v1/integrations", resilientProxy("integration", SERVICES.integration));
// Public API Service — catch-all for /api/v1/* (MUST be LAST to avoid shadowing specific routes above)
app.use("/api/v1", resilientProxy("publicApi", SERVICES.publicApi));
app.use("/api/public", resilientProxy("publicApi", SERVICES.publicApi));
app.use("/api/serve", resilientProxy("publicApi", SERVICES.publicApi));
// Notification Service
app.use("/api/notifications", resilientProxy("notification", SERVICES.notification));
app.use("/api/notification-preferences", resilientProxy("notification", SERVICES.notification));
// HR Service
app.use("/api/employees", resilientProxy("hr", SERVICES.hr));
app.use("/api/hr", resilientProxy("hr", SERVICES.hr));
app.use("/api/time-tracking", resilientProxy("hr", SERVICES.hr));
app.use("/api/payroll-hr", resilientProxy("hr", SERVICES.hr));
// Project Service
app.use("/api/projects", resilientProxy("project", SERVICES.project));
app.use("/api/kanban", resilientProxy("project", SERVICES.project));
app.use("/api/tasks", resilientProxy("project", SERVICES.project));
app.use("/api/portfolio", resilientProxy("project", SERVICES.project));
app.use("/api/cms", resilientProxy("project", SERVICES.project));
// POS Service
app.use("/api/v1/pos", resilientProxy("pos", SERVICES.pos));
app.use("/api/pos", resilientProxy("pos", SERVICES.pos));
// Affiliate Service
app.use("/r", resilientProxy("affiliate", SERVICES.affiliate));
app.use("/api/affiliates", resilientProxy("affiliate", SERVICES.affiliate));
// ── Fallback ─────────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ error: "Route not found", hint: "Check the API Gateway route table" });
});
const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`🌐 API Gateway running on port ${PORT}`);
    console.log(`   Routes: auth→${SERVICES.auth}, crm→${SERVICES.crm}, automation→${SERVICES.automation}`);
    console.log(`   Routes: ai→${SERVICES.ai}, inbox→${SERVICES.inbox}, finance→${SERVICES.finance}`);
    console.log(`   Routes: video→${SERVICES.video}, calendar→${SERVICES.calendar}`);
    console.log(`   Routes: marketing→${SERVICES.marketing}, integration→${SERVICES.integration}`);
    console.log(`   Routes: document→${SERVICES.document}, agentTeam→${SERVICES.agentTeam}`);
    console.log(`   Routes: analytics→${SERVICES.analytics}, admin→${SERVICES.admin}, publicApi→${SERVICES.publicApi}`);
    console.log(`   Routes: notification→${SERVICES.notification}, hr→${SERVICES.hr}, project→${SERVICES.project}`);
});
(0, service_auth_1.setupGracefulShutdown)(server);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
exports.default = app;
//# sourceMappingURL=index.js.map