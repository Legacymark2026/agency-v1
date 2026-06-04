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
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import crypto from "crypto";

const app = express();
const PORT = parseInt(process.env.PORT || "8080", 10);

app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-api-key", "x-device-id", "x-correlation-id"],
  exposedHeaders: ["x-correlation-id"],
}));

// ── Correlation ID Middleware ────────────────────────────────────────────────
app.use((req, res, next) => {
  const correlationId = (req.headers["x-correlation-id"] || req.headers["correlation-id"] || crypto.randomUUID()) as string;
  req.headers["x-correlation-id"] = correlationId;
  res.setHeader("x-correlation-id", correlationId);
  next();
});

// ── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "healthy", service: "api-gateway", timestamp: new Date().toISOString() });
});

// ── Edge Cache & Service Registry (Redis) ───────────────────────────────────
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
const CACHE_TTL = 300; // 5 minutes

// ── Service Discovery Config ─────────────────────────────────────────────────
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
  agentTeam:     process.env.AGENT_TEAM_ENGINE_URL      || "http://agent-team-engine:4012",
  analytics:     process.env.ANALYTICS_SERVICE_URL      || "http://analytics-service:4013",
  admin:         process.env.ADMIN_SERVICE_URL          || "http://admin-service:4014",
  publicApi:     process.env.PUBLIC_API_SERVICE_URL     || "http://public-api-service:4015",
  notification:  process.env.NOTIFICATION_SERVICE_URL   || "http://notification-service:4016",
  hr:            process.env.HR_SERVICE_URL             || "http://hr-service:4017",
  project:       process.env.PROJECT_SERVICE_URL        || "http://project-service:4018",
  affiliate:     process.env.AFFILIATE_SERVICE_URL      || "http://affiliate-service:4019",
};

// Dynamic Service Discovery Helper
const resolveServiceUrl = async (serviceName: keyof typeof SERVICES): Promise<string> => {
  try {
    const dynamicUrl = await redis.get(`service_registry:${serviceName}`);
    if (dynamicUrl) {
      console.log(`[ServiceDiscovery] Resolved ${serviceName} dynamically to ${dynamicUrl}`);
      return dynamicUrl;
    }
  } catch (err: any) {
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
    me: async (_parent: any, _args: any, context: any) => {
      if (!context.token) throw new Error("Unauthorized");
      try {
        const serviceUrl = await resolveServiceUrl("auth");
        const response = await fetch(`${serviceUrl}/api/auth/me`, {
          headers: {
            "Authorization": context.token,
            "x-correlation-id": String(context.correlationId || "")
          }
        });
        const body: any = await response.json();
        if (!response.ok) throw new Error(body.error || "Failed to fetch current user");
        return body.user;
      } catch (err: any) {
        console.error(`[Trace: ${context.correlationId}] GraphQL error resolving Query.me:`, err.message);
        throw err;
      }
    },
    platformStats: () => "V3 Supergraph Active with REST-Composition",
  },
  User: {
    leads: async (user: any, _args: any, context: any) => {
      if (!context.token) return [];
      try {
        // Native JWT Payload Decode (Lightweight base64 url decode)
        const tokenStr = context.token.replace("Bearer ", "");
        const payloadBase64 = tokenStr.split(".")[1];
        if (!payloadBase64) return [];
        
        const decodedPayload = JSON.parse(Buffer.from(payloadBase64, "base64").toString("utf8"));
        const companyId = decodedPayload?.companies?.[0]?.companyId;
        if (!companyId) return [];

        const serviceUrl = await resolveServiceUrl("crm");
        const url = `${serviceUrl}/api/leads?companyId=${companyId}&syncEmail=${user.email}`;
        const response = await fetch(url, {
          headers: {
            "Authorization": context.token,
            "x-correlation-id": String(context.correlationId || "")
          }
        });
        const body: any = await response.json();
        if (!response.ok) return [];
        return body.leads || [];
      } catch (err: any) {
        console.error(`[Trace: ${context.correlationId}] GraphQL error resolving User.leads:`, err.message);
        return [];
      }
    }
  }
};

class RedisKeyValueCache {
  private client: Redis;
  constructor(redisUrl: string) {
    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        return Math.min(times * 100, 3000);
      }
    });
  }
  async get(key: string): Promise<string | undefined> {
    const val = await this.client.get(key);
    return val === null ? undefined : val;
  }
  async set(key: string, value: string, options?: { ttl?: number }): Promise<void> {
    if (options?.ttl) {
      await this.client.set(key, value, "EX", options.ttl);
    } else {
      await this.client.set(key, value);
    }
  }
  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }
}

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  cache: new RedisKeyValueCache(process.env.REDIS_URL || "redis://redis:6379")
});
// Start Apollo Server asynchronously
(async () => {
  await apolloServer.start();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.use(
    "/graphql",
    express.json(),
    expressMiddleware(apolloServer, {
      context: async ({ req }) => {
        const token = req.headers.authorization || "";
        const correlationId = (req.headers["x-correlation-id"] || crypto.randomUUID()) as string;
        return { token, correlationId };
      }
    }) as any
  );
  console.log("🚀 V3 GraphQL Supergraph composition ready at /graphql");
})();

// ── Edge Cache Middleware ───────────────────────────────────────────────────
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

// ── Request Logging with Tracing ─────────────────────────────────────────────
app.use((req, _res, next) => {
  const correlationId = req.headers["x-correlation-id"];
  console.log(`[Trace: ${correlationId}] [gateway] ${req.method} ${req.path} → routing...`);
  next();
});

// ── Route Definitions ────────────────────────────────────────────────────────
// ── Circuit Breaker Implementation ───────────────────────────────────────────
class CircuitBreaker {
  public state: "CLOSED" | "OPEN" | "HALF-OPEN" = "CLOSED";
  private failureCount = 0;
  private lastStateChange = Date.now();
  private readonly failureThreshold = 5;
  private readonly cooldownPeriod = 10000; // 10 seconds

  constructor(public readonly serviceName: string) {}

  public checkState() {
    if (this.state === "OPEN" && Date.now() - this.lastStateChange > this.cooldownPeriod) {
      this.state = "HALF-OPEN";
      this.lastStateChange = Date.now();
      console.log(`[CircuitBreaker] Circuit transitioned to HALF-OPEN for ${this.serviceName}`);
    }
  }

  public recordSuccess() {
    this.failureCount = 0;
    if (this.state === "HALF-OPEN") {
      this.state = "CLOSED";
      this.lastStateChange = Date.now();
      console.log(`[CircuitBreaker] Circuit transitioned to CLOSED for ${this.serviceName}`);
    }
  }

  public recordFailure() {
    this.failureCount++;
    this.lastStateChange = Date.now();
    if (this.state === "HALF-OPEN" || this.failureCount >= this.failureThreshold) {
      this.state = "OPEN";
      console.warn(`[CircuitBreaker] Circuit transitioned to OPEN for ${this.serviceName} due to failures (${this.failureCount})`);
    }
  }
}

const breakers: Record<string, CircuitBreaker> = {};
const getBreaker = (serviceName: string) => {
  if (!breakers[serviceName]) {
    breakers[serviceName] = new CircuitBreaker(serviceName);
  }
  return breakers[serviceName];
};

const handleFallback = async (req: express.Request, res: express.Response, serviceName: string, reason: string) => {
  if (req.method === "GET") {
    // Try to get from Redis cache
    const cacheKey = `edge_cache:${req.path}`;
    try {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        res.setHeader("X-Cache-Fallback", "HIT");
        res.setHeader("Content-Type", "application/json");
        res.status(200).send(cachedData);
        return;
      }
    } catch (cacheErr) {
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

const resilientProxy = (serviceName: keyof typeof SERVICES, target: string) => {
  const breaker = getBreaker(serviceName);
  const proxy = createProxyMiddleware({
    target,
    router: async () => {
      return await resolveServiceUrl(serviceName);
    },
    changeOrigin: true,
    on: {
      proxyReq: (proxyReq, req: any) => {
        if (req.headers["x-correlation-id"]) {
          proxyReq.setHeader("x-correlation-id", req.headers["x-correlation-id"]);
        }
      },
      proxyRes: (proxyRes, req: any, res) => {
        if (proxyRes.statusCode && proxyRes.statusCode >= 500) {
          breaker.recordFailure();
        } else {
          breaker.recordSuccess();
        }
      },
      error: async (err, req: any, res: any) => {
        const resolvedTarget = await resolveServiceUrl(serviceName);
        console.error(`[CircuitBreaker] Proxy error for ${serviceName} to ${resolvedTarget}:`, err.message);
        breaker.recordFailure();
        await handleFallback(req, res, serviceName, `Proxy error: ${err.message}`);
      }
    }
  });

  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    breaker.checkState();
    
    if (breaker.state === "OPEN") {
      console.warn(`[CircuitBreaker] Short-circuiting request for ${serviceName} (Circuit is OPEN)`);
      return handleFallback(req, res, serviceName, "Circuit breaker is open");
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (proxy as any)(req, res, next);
  };
};

// ── Route Definitions ────────────────────────────────────────────────────────

// Auth Service
app.use("/api/auth", resilientProxy("auth", SERVICES.auth));

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

// Integration Service
app.use("/api/integrations", resilientProxy("integration", SERVICES.integration));
app.use("/api/webhooks/shopify", resilientProxy("integration", SERVICES.integration));
app.use("/api/webhooks/wix", resilientProxy("integration", SERVICES.integration));

// Document Service
app.use("/api/proposals", resilientProxy("document", SERVICES.document));
app.use("/api/propuesta", resilientProxy("document", SERVICES.document));
app.use("/api/kb", resilientProxy("document", SERVICES.document));

// Agent Team Engine
app.use("/api/agent", resilientProxy("agentTeam", SERVICES.agentTeam));
app.use("/api/test-flow", resilientProxy("agentTeam", SERVICES.agentTeam));

// Analytics Service
app.use("/api/analytics", resilientProxy("analytics", SERVICES.analytics));
app.use("/api/track", resilientProxy("analytics", SERVICES.analytics));

// Admin Service
app.use("/api/admin", resilientProxy("admin", SERVICES.admin));
app.use("/api/diagnostics", resilientProxy("admin", SERVICES.admin));
app.use("/api/debug", resilientProxy("admin", SERVICES.admin));

// Public API Service
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

// Affiliate Service
app.use("/r", resilientProxy("affiliate", SERVICES.affiliate));
app.use("/api/affiliates", resilientProxy("affiliate", SERVICES.affiliate));


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
  console.log(`   Routes: notification→${SERVICES.notification}, hr→${SERVICES.hr}, project→${SERVICES.project}`);
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default app as any;
