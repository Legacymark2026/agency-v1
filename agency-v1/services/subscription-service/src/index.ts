/**
 * Centralized SaaS Subscription Microservice (Subscription & Anti-Abuse Engine)
 * Port: 4060 (HTTP) | Port: 50054 (gRPC Encrypted)
 *
 * Responsibilities:
 *   - SaaS Subscription lifecycle (FREE, STARTER, PRO, ENTERPRISE)
 *   - Device Fingerprint registry to eliminate Free Trial abuse
 *   - Prior trial eligibility check for AuthZ and PDP engines
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import { metricsMiddleware, metricsEndpoint } from "@agency/observability";
import { setupGracefulShutdown, tenantContextMiddleware, globalErrorHandler } from "@agency/service-auth";
import { EventBus } from "@agency/events";
import { prisma } from "@agency/database";
import { deviceFingerprintMiddleware } from "@agency/device-fingerprint";
import { PrismaSubscriptionAdapter } from "./adapters/subscription-prisma.adapter";
import { SubscriptionUseCases } from "./core/usecases/subscription.usecases";
import { createSubscriptionRouter } from "./routes/subscription.routes";

const app = express();
const PORT = process.env.PORT || 4060;
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const eventBus = new EventBus(REDIS_URL, "subscription-service");
const adapter = new PrismaSubscriptionAdapter(eventBus);
const useCases = new SubscriptionUseCases(adapter, adapter, adapter);

app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"],
  credentials: true,
}));
app.use(
  express.json({
    limit: "2mb",
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(deviceFingerprintMiddleware());
app.use(tenantContextMiddleware);
app.use(metricsMiddleware("subscription-service"));

app.get("/metrics", metricsEndpoint);

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "healthy",
      service: "subscription-service",
      version: "1.0.0",
      engine: "Hexagonal-SaaS-Subscription-AntiAbuse",
      db: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(503).json({
      status: "unhealthy",
      service: "subscription-service",
      db: "disconnected",
      error: err.message,
    });
  }
});

// Mount Routes
app.use("/api/subscriptions", createSubscriptionRouter(useCases));
app.use("/api/v1/subscriptions", createSubscriptionRouter(useCases));

app.use(globalErrorHandler);

// ── Synchronous Encrypted gRPC Server Setup (Port 50054) ─────────────────────
import { GrpcServerHelper, PROTO_PATHS } from "@agency/grpc";
const GRPC_PORT = parseInt(process.env.GRPC_PORT || "50054", 10);
const grpcServer = new GrpcServerHelper();

grpcServer.addService(PROTO_PATHS.subscription, "subscription", "SubscriptionService", {
  CheckTrialEligibility: async (call: any, callback: any) => {
    try {
      const { companyId, deviceFingerprint } = call.request;
      const result = await useCases.checkEligibility(companyId, deviceFingerprint);
      callback(null, {
        eligible: result.eligible,
        reason: result.reason,
        previousCompanyId: result.existingRecord?.companyId || "",
        deviceHash: deviceFingerprint,
      });
    } catch (err: any) {
      callback(null, {
        eligible: false,
        reason: err.message,
        previousCompanyId: "",
        deviceHash: call.request.deviceFingerprint,
      });
    }
  },

  GetSubscriptionDetails: async (call: any, callback: any) => {
    try {
      const { companyId } = call.request;
      const sub = await useCases.getSubscriptionDetails(companyId);
      if (!sub) {
        return callback(null, {
          success: false,
          companyId,
          tier: "free",
          status: "inactive",
          isTrialActive: false,
          trialEndsAtUnix: 0,
          error: "Subscription not found",
        });
      }

      const isTrial = sub.status === "trialing" && sub.trialEndsAt ? sub.trialEndsAt.getTime() > Date.now() : false;

      callback(null, {
        success: true,
        companyId: sub.companyId,
        tier: sub.tier,
        status: sub.status,
        isTrialActive: isTrial,
        trialEndsAtUnix: sub.trialEndsAt ? Math.floor(sub.trialEndsAt.getTime() / 1000) : 0,
        error: "",
      });
    } catch (err: any) {
      callback(null, {
        success: false,
        companyId: call.request.companyId,
        tier: "free",
        status: "error",
        isTrialActive: false,
        trialEndsAtUnix: 0,
        error: err.message,
      });
    }
  },

  ClaimFreeTrial: async (call: any, callback: any) => {
    try {
      const { companyId, deviceFingerprint, ipAddress, durationDays } = call.request;
      const result = await useCases.claimFreeTrial({
        companyId,
        deviceHash: deviceFingerprint,
        durationDays: durationDays || 14,
        ipSubnet: ipAddress,
      });

      callback(null, {
        success: result.success,
        message: result.success ? "Trial granted" : (result.error || "Denied"),
        trialEndsAtUnix: result.trialEndsAt ? Math.floor(result.trialEndsAt.getTime() / 1000) : 0,
        error: result.error || "",
      });
    } catch (err: any) {
      callback(null, {
        success: false,
        message: err.message,
        trialEndsAtUnix: 0,
        error: err.message,
      });
    }
  },
});

grpcServer.start(GRPC_PORT).catch((err: any) => {
  console.error("[subscription-service] Failed to start gRPC server:", err.message);
});

// ── Event-Driven Autonomous Subscription Synchronization ─────────────────────
eventBus.subscribe("payment.succeeded" as any, async (event: any) => {
  try {
    const payload = event?.data || event;
    const { companyId, reference, amount } = payload;
    if (!companyId) return;

    console.log(`[subscription-service] payment.succeeded received for company: ${companyId}, ref: ${reference}`);
    // Auto-upgrade / renew company subscription upon payment confirmation
    await prisma.company.update({
      where: { id: companyId },
      data: {
        subscriptionStatus: "active",
        subscriptionTier: "pro", // Default to paid pro tier on direct successful payment
      },
    }).catch(() => {});
  } catch (err: any) {
    console.warn("[subscription-service] Failed to handle payment.succeeded event:", err.message);
  }
}).catch((err: any) => console.warn("[subscription-service] Subscribe error for payment.succeeded:", err.message));

eventBus.subscribe("invoice.paid" as any, async (event: any) => {
  try {
    const payload = event?.data || event;
    const companyId = payload.companyId || payload.tenantId;
    if (!companyId) return;

    console.log(`[subscription-service] invoice.paid received for company: ${companyId}`);
    await prisma.company.update({
      where: { id: companyId },
      data: { subscriptionStatus: "active" },
    }).catch(() => {});
  } catch (err: any) {
    console.warn("[subscription-service] Failed to handle invoice.paid event:", err.message);
  }
}).catch((err: any) => console.warn("[subscription-service] Subscribe error for invoice.paid:", err.message));

const server = app.listen(PORT, () => {
  console.log(`💳 Subscription Service running on port ${PORT} (HTTP) and port ${GRPC_PORT} (gRPC Encrypted)`);
});

setupGracefulShutdown(server, async () => {
  console.log("[subscription-service] Shutting down cleanly...");
  await grpcServer.forceShutdown();
  await eventBus.disconnect();
  await prisma.$disconnect();
});

export default app;
