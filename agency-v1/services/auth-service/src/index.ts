/**
 * Auth Service — Identity & Access Management Microservice
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles: Authentication, Authorization, RBAC, MFA, Sessions, API Keys
 * Port: 4001
 *
 * DB routing (via @agency/database proxy):
 *   - User, Session, Account, Role, Permission, RoleConfig, ApiKey → AUTH DB
 *   - CompanyUser → CORE DB (soft-linked by userId)
 *   - UserActivityLog → ANALYTICS DB
 */

import "@agency/observability/register";
import { metricsMiddleware, metricsEndpoint } from "@agency/observability";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { prisma } from "@agency/database";
import { EventBus } from "@agency/events";
import Redis from "ioredis";
import fs from "fs";
import path from "path";

const app = express();
app.use(metricsMiddleware("auth-service"));
const PORT = parseInt(process.env.PORT || "4001", 10);
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const redis = new Redis(REDIS_URL);
import crypto from "crypto";

redis.on("error", (err) => console.error("[auth-service] Redis error:", err.message));

// Load or Auto-Generate RS256 Keys for JWT Signing & JWKS Verification
let privateKey: string | null = null;
let publicKey: string | null = null;

try {
  if (fs.existsSync("/certs/private.key")) {
    privateKey = fs.readFileSync("/certs/private.key", "utf8");
    publicKey = fs.readFileSync("/certs/public.key", "utf8");
    console.log("[auth-service] RS256 keys loaded from /certs");
  } else {
    const localPrivate = path.join(__dirname, "../../../certs/private.key");
    const localPublic = path.join(__dirname, "../../../certs/public.key");
    if (fs.existsSync(localPrivate)) {
      privateKey = fs.readFileSync(localPrivate, "utf8");
      publicKey = fs.readFileSync(localPublic, "utf8");
      console.log("[auth-service] RS256 keys loaded from local certs");
    }
  }
} catch (err: any) {
  console.warn("[auth-service] Key load warning:", err.message);
}

// Auto-generate RSA 2048-bit KeyPair if missing
if (!privateKey || !publicKey) {
  console.log("[auth-service] Auto-generating 2048-bit RSA KeyPair for RS256 signing and JWKS...");
  const { privateKey: genPrivate, publicKey: genPublic } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  privateKey = genPrivate;
  publicKey = genPublic;
}

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(",") || "*" }));
app.use(express.json({ limit: "1mb" }));

// ── JWKS Endpoint (JSON Web Key Set - Inter-service Public Key Verification) ──
app.get("/.well-known/jwks.json", (_req, res) => {
  try {
    if (!publicKey) return res.status(500).json({ error: "Public key unavailable" });
    const pubKeyObj = crypto.createPublicKey(publicKey);
    const jwk = pubKeyObj.export({ format: "jwk" });
    res.json({
      keys: [
        {
          ...jwk,
          use: "sig",
          alg: "RS256",
          kid: "auth-service-rs256-key-1",
        },
      ],
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Helper: write activity log (fire-and-forget, never throws) ────────────────
async function logActivity(
  userId: string | null,
  action: string,
  details: Record<string, unknown>,
  req: express.Request
): Promise<void> {
  try {
    await (prisma as any).userActivityLog.create({
      data: {
        userId,
        action,
        details,
        ipAddress: req.ip ?? null,
        userAgent: req.headers["user-agent"] ?? null,
      },
    });
  } catch {
    // Non-critical — never block the request on a logging failure
  }
}

// ── Health Checks (Required for K8s) ─────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "healthy", service: "auth-service", timestamp: new Date().toISOString() });
});

app.get("/metrics", metricsEndpoint);

app.get("/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ready", db: "connected" });
  } catch (err) {
    res.status(503).json({ status: "not_ready", db: "disconnected", error: String(err) });
  }
});

// ── Auth Routes ──────────────────────────────────────────────────────────────

// POST /api/auth/login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    // Step 1: Fetch user from AUTH DB (no cross-DB include)
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      await logActivity(null, "login_failed", { email, reason: "user_not_found" }, req);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const bcrypt = await import("bcryptjs");
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      await logActivity(user.id, "login_failed", { email, reason: "invalid_password" }, req);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (user.deactivatedAt) {
      await logActivity(user.id, "login_failed", { email, reason: "account_deactivated" }, req);
      return res.status(403).json({ error: "Account deactivated" });
    }

    // Step 2: Fetch company memberships from CORE DB (separate query via proxy)
    let companyMemberships: Array<{
      id: string;
      companyId: string;
      roleName: string;
      company: { id: string; name: string };
    }> = [];

    try {
      const rawMemberships = await (prisma as any).companyUser.findMany({
        where: { userId: user.id },
        include: { company: { select: { id: true, name: true } } },
      });
      companyMemberships = rawMemberships ?? [];
    } catch (err) {
      // Non-fatal — user can log in without company data
      console.warn("[auth-service] Could not fetch company memberships for user:", user.id, err);
    }

    // Generate JWT
    const jwt = await import("jsonwebtoken");
    const signKey = privateKey || process.env.JWT_SECRET || "dev-secret-change-me";
    const signOptions: any = { expiresIn: "24h" };
    if (privateKey) {
      signOptions.algorithm = "RS256";
    }
    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        globalRole: user.globalRole,
        companies: companyMemberships.map((c) => ({
          companyId: c.companyId,
          roleName: c.roleName,
          companyName: c.company?.name ?? "",
        })),
      },
      signKey,
      signOptions
    );

    // Create session in AUTH DB
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        sessionToken: token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      },
    });

    // Log successful login to ANALYTICS DB (fire-and-forget)
    await logActivity(user.id, "login_success", { sessionId: session.id, email: user.email }, req);

    res.json({
      token,
      sessionId: session.id,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        globalRole: user.globalRole,
        image: user.image,
      },
    });
  } catch (err) {
    console.error("[auth-service] Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/auth/me — Validate token and return user info
app.get("/api/auth/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.slice(7);

    // Check Redis blacklist
    const isBlacklisted = await redis.get(`jwt:blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({ error: "Token has been revoked" });
    }

    const jwt = await import("jsonwebtoken");
    const verifyKey = publicKey || process.env.JWT_SECRET || "dev-secret-change-me";
    const verifyOptions: any = {};
    if (publicKey) {
      verifyOptions.algorithms = ["RS256"];
    }

    const decoded = jwt.verify(token, verifyKey, verifyOptions) as unknown as {
      sub: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        role: true,
        globalRole: true,
        image: true,
        mfaEnabled: true,
      },
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ user });
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
});

// POST /api/auth/logout — Revoke token immediately by blacklisting it in Redis
app.post("/api/auth/logout", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(400).json({ error: "No token provided" });
    }

    const token = authHeader.slice(7);
    const jwt = await import("jsonwebtoken");
    const verifyKey = publicKey || process.env.JWT_SECRET || "dev-secret-change-me";
    const verifyOptions: any = {};
    if (publicKey) {
      verifyOptions.algorithms = ["RS256"];
    }

    // Verify first to get expiration and ensure it's a valid token structure
    const decoded = jwt.verify(token, verifyKey, verifyOptions) as { exp?: number; sub?: string };

    // Calculate remaining TTL in seconds
    let ttl = 24 * 60 * 60;
    if (decoded.exp) {
      const now = Math.floor(Date.now() / 1000);
      ttl = Math.max(1, decoded.exp - now);
    }

    // Add to Redis blacklist
    await redis.setex(`jwt:blacklist:${token}`, ttl, "revoked");

    // Clean up SQL session table
    await prisma.session.deleteMany({
      where: { sessionToken: token },
    });

    // Log logout to ANALYTICS DB (fire-and-forget)
    if (decoded.sub) {
      await logActivity(decoded.sub, "logout", {}, req);
    }

    res.json({ success: true, message: "Logged out and token blacklisted successfully" });
  } catch (err: any) {
    // Even if verification fails (e.g. token expired), we delete database sessions matching it
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      await prisma.session.deleteMany({ where: { sessionToken: token } }).catch(() => {});
    }
    res.status(401).json({ error: "Invalid token or already expired" });
  }
});

// POST /api/auth/validate — Internal service-to-service token validation
app.post("/api/auth/validate", async (req, res) => {
  // Verify internal service secret
  const authHeader = req.headers.authorization;
  const internalSecret = process.env.INTERNAL_SECRET || "video-service-secret-change-in-production";
  if (!authHeader || authHeader !== `Bearer ${internalSecret}`) {
    return res.status(401).json({ error: "Unauthorized inter-service request" });
  }

  try {
    const { token } = req.body;

    // Check Redis blacklist
    const isBlacklisted = await redis.get(`jwt:blacklist:${token}`);
    if (isBlacklisted) {
      return res.json({ valid: false, reason: "revoked" });
    }

    const jwt = await import("jsonwebtoken");
    const verifyKey = publicKey || process.env.JWT_SECRET || "dev-secret-change-me";
    const verifyOptions: any = {};
    if (publicKey) {
      verifyOptions.algorithms = ["RS256"];
    }

    const decoded = jwt.verify(token, verifyKey, verifyOptions);
    res.json({ valid: true, claims: decoded });
  } catch {
    res.json({ valid: false });
  }
});

// POST /api/auth/check-permission — ACL Granular Permission Evaluator (RBAC + ACL Overrides)
app.post("/api/auth/check-permission", async (req, res) => {
  try {
    const { userId, permissionCode } = req.body;
    if (!userId || !permissionCode) {
      return res.status(400).json({ allowed: false, error: "userId and permissionCode are required" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, globalRole: true },
    });

    if (!user) {
      return res.json({ allowed: false, reason: "User not found" });
    }

    // SuperAdmin bypasses all permission checks
    if (user.role === "super_admin" || user.globalRole === "super_admin") {
      return res.json({ allowed: true, grantedBy: "SUPER_ADMIN" });
    }

    // Check Role Permissions
    const roleConfig = await prisma.roleConfig.findUnique({
      where: { roleName: user.role || "guest" },
    });

    const allowedRoutes = (roleConfig?.allowedRoutes as string[]) || [];
    const isAllowed = allowedRoutes.some(
      (pattern) => pattern === permissionCode || pattern === "/api/*" || permissionCode.startsWith(pattern.replace("*", ""))
    );

    res.json({
      allowed: isAllowed,
      grantedBy: isAllowed ? "ROLE_PERMISSIONS" : "NONE",
      permissionCode,
      role: user.role,
    });
  } catch (err: any) {
    res.status(500).json({ allowed: false, error: err.message });
  }
});

// GET /api/auth/roles/:companyId — Get roles for a company
app.get("/api/auth/roles/:companyId", async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      where: { companyId: req.params.companyId, isActive: true },
      include: { permissions: { include: { permission: true } } },
    });
    res.json({ roles });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Custom Roles CRUD
app.get('/api/auth/roles/full/:companyId', async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      where: { companyId: req.params.companyId, isActive: true },
      include: {
        permissions: {
          include: {
            permission: { select: { id: true, name: true, module: true, description: true } }
          }
        },
        _count: { select: { permissions: true } }
      },
      orderBy: [{ priority: 'desc' }, { name: 'asc' }]
    });
    res.json(roles);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/auth/roles/:id/detail', async (req, res) => {
  try {
    const role = await prisma.role.findFirst({
      where: { id: req.params.id },
      include: {
        permissions: {
          include: {
            permission: { select: { id: true, name: true, module: true, description: true } }
          }
        },
        _count: { select: { users: true } }
      }
    });
    res.json(role);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/roles', async (req, res) => {
  try {
    const { companyId, name, description, isDefault, priority, permissionIds } = req.body;
    const existing = await prisma.role.findFirst({ where: { companyId, name } });
    if (existing) return res.status(400).json({ error: 'Ya existe un rol con este nombre' });

    if (isDefault) {
      await prisma.role.updateMany({ where: { companyId, isDefault: true }, data: { isDefault: false } });
    }

    const role = await prisma.role.create({
      data: {
        companyId,
        name,
        description,
        isDefault: isDefault ?? false,
        priority: priority ?? 0,
        permissions: {
          create: (permissionIds || []).map((pId: string) => ({ permissionId: pId }))
        }
      },
      include: { permissions: { include: { permission: true } } }
    });
    res.status(201).json(role);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/auth/roles/:id', async (req, res) => {
  try {
    const { companyId, name, description, isDefault, isActive, priority, permissionIds } = req.body;
    const existing = await prisma.role.findFirst({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Rol no encontrado' });

    if (isDefault && !existing.isDefault) {
      await prisma.role.updateMany({ where: { companyId: existing.companyId, isDefault: true }, data: { isDefault: false } });
    }

    const role = await prisma.role.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(isDefault !== undefined && { isDefault }),
        ...(isActive !== undefined && { isActive }),
        ...(priority !== undefined && { priority })
      },
      include: { permissions: { include: { permission: true } } }
    });

    if (permissionIds !== undefined) {
      await prisma.rolePermission.deleteMany({ where: { roleId: req.params.id } });
      if (permissionIds.length > 0) {
        await prisma.rolePermission.createMany({
          data: permissionIds.map((pId: string) => ({ roleId: req.params.id, permissionId: pId }))
        });
      }
    }
    res.json(role);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/auth/roles/:id', async (req, res) => {
  try {
    const role = await prisma.role.findUnique({ where: { id: req.params.id } });
    if (!role) return res.status(404).json({ error: 'Rol no encontrado' });

    // Check if any companyUser has this roleName in CORE DB
    const usersWithRole = await (prisma as any).companyUser.count({
      where: { companyId: role.companyId, roleName: role.name }
    });
    if (usersWithRole > 0) return res.status(400).json({ error: 'El rol tiene usuarios asignados' });

    await prisma.rolePermission.deleteMany({ where: { roleId: req.params.id } });
    await prisma.role.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// User Assignment & RBAC Stats
app.patch('/api/auth/assign-role', async (req, res) => {
  try {
    const { userId, companyId, roleId } = req.body;
    // companyUser lives in CORE DB — accessed via proxy
    const target = await (prisma as any).companyUser.findFirst({ where: { userId, companyId } });
    if (!target) return res.status(400).json({ error: 'El usuario no pertenece a esta empresa' });

    // Update roleName by looking up the role name from AUTH DB
    const role = await prisma.role.findUnique({ where: { id: roleId }, select: { name: true } });
    if (!role) return res.status(404).json({ error: 'Rol no encontrado' });

    await (prisma as any).companyUser.update({
      where: { id: target.id },
      data: { roleName: role.name }
    });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/auth/users-with-roles/:companyId', async (req, res) => {
  try {
    // Step 1: Get company members from CORE DB
    const members = await (prisma as any).companyUser.findMany({
      where: { companyId: req.params.companyId },
      include: {
        team: { select: { id: true, name: true } }
      },
      orderBy: [{ joinedAt: 'desc' }]
    });

    if (!members || members.length === 0) {
      return res.json([]);
    }

    // Step 2: Fetch user details from AUTH DB (batch)
    const userIds = members.map((m: any) => m.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, image: true }
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    // Step 3: Combine results
    const result = members.map((m: any) => ({
      id: m.id,
      userId: m.userId,
      companyId: m.companyId,
      roleName: m.roleName,
      joinedAt: m.joinedAt,
      team: m.team,
      user: userMap.get(m.userId) ?? null,
    }));

    res.json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/auth/permissions', async (req, res) => {
  try {
    const permissions = await prisma.permission.findMany({
      where: { isActive: true },
      orderBy: [{ module: 'asc' }, { name: 'asc' }]
    });
    res.json(permissions);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/permissions/sync', async (req, res) => {
  try {
    const { permissions } = req.body;
    const existing = await prisma.permission.findMany({ select: { name: true } });
    const existingNames = new Set(existing.map(p => p.name));
    let created = 0;
    for (const perm of permissions) {
      if (existingNames.has(perm.name)) continue;
      await prisma.permission.create({
        data: { name: perm.name, module: perm.module, description: perm.description, isActive: true }
      });
      created++;
    }
    res.json({ success: true, created });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// MFA Endpoints
app.get('/api/auth/users/:id/mfa', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { email: true, mfaEnabled: true, mfaSecret: true, backupCodes: true }
    });
    res.json(user);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/auth/users/:id/mfa', async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// RoleConfig & Global Users Endpoints
app.post('/api/auth/role-configs', async (req, res) => {
  try {
    const { roleName, allowedRoutes, description, isActive } = req.body;
    const name = roleName.trim().toLowerCase();
    const config = await prisma.roleConfig.upsert({
      where: { roleName: name },
      create: {
        roleName: name,
        allowedRoutes,
        description: description ?? null,
        isActive: isActive ?? true,
      },
      update: {
        allowedRoutes,
        description: description ?? null,
        isActive: isActive ?? true,
      },
    });
    res.json(config);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/auth/role-configs/:roleName', async (req, res) => {
  try {
    const name = req.params.roleName.trim().toLowerCase();
    await prisma.roleConfig.delete({ where: { roleName: name } });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/auth/role-configs', async (req, res) => {
  try {
    const configs = await prisma.roleConfig.findMany({ orderBy: { roleName: 'asc' } });
    res.json(configs);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/auth/global-users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        deactivatedAt: true,
      },
      orderBy: { role: 'asc' },
    });
    res.json(users);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/auth/global-users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    const name = role.trim().toLowerCase();
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role: name },
    });
    res.json({ success: true, user });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Event Bus Setup ──────────────────────────────────────────────────────────
const eventBus = new EventBus(REDIS_URL, "auth-service");

// ── High-Speed Synchronous gRPC Server Setup ──────────────────────────────────
import { GrpcServerHelper, PROTO_PATHS } from "@agency/grpc";
import jwt from "jsonwebtoken";

const GRPC_PORT = parseInt(process.env.GRPC_PORT || "50051", 10);
const grpcServer = new GrpcServerHelper();

grpcServer.addService(PROTO_PATHS.auth, "auth", "AuthService", {
  ValidateToken: async (call: any, callback: any) => {
    try {
      const { token } = call.request;
      if (!token) {
        return callback(null, { valid: false, error: "Token is required" });
      }

      // Check Redis blacklist
      const isBlacklisted = await redis.get(`jwt:blacklist:${token}`);
      if (isBlacklisted) {
        return callback(null, { valid: false, error: "Token has been revoked" });
      }

      const verifyKey = publicKey || process.env.JWT_SECRET || "dev-secret-change-me";
      const verifyOptions: any = {};
      if (publicKey) verifyOptions.algorithms = ["RS256"];

      const decoded = jwt.verify(token, verifyKey, verifyOptions) as any;
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.sub },
        select: { id: true, email: true, role: true }
      });

      if (!user) {
        return callback(null, { valid: false, error: "User not found" });
      }

      callback(null, {
        valid: true,
        userId: user.id,
        email: user.email,
        role: user.role || "user",
        companyId: decoded.companyId || "",
        error: ""
      });
    } catch (err: any) {
      callback(null, { valid: false, error: err.message || "Invalid token" });
    }
  },

  GetUserPermissions: async (call: any, callback: any) => {
    try {
      const { userId } = call.request;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true }
      });

      if (!user) {
        return callback(null, { userId, permissions: [], role: "" });
      }

      const roleConfig = await prisma.roleConfig.findUnique({
        where: { roleName: user.role || "user" }
      });

      const permissions = roleConfig?.allowedRoutes || ["/api/*"];

      callback(null, {
        userId: user.id,
        permissions,
        role: user.role || "user"
      });
    } catch (err: any) {
      callback(null, { userId: call.request.userId, permissions: [], role: "" });
    }
  }
});

grpcServer.start(GRPC_PORT).catch(err => {
  console.error("[auth-service] Failed to start gRPC server:", err.message);
});

import { errorHandler } from "./middlewares/auth.middleware";
app.use(errorHandler as any);

// ── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🔐 Auth Service running on port ${PORT} (HTTP) and port ${GRPC_PORT} (gRPC Sync)`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Ready:  http://localhost:${PORT}/ready`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("[auth-service] SIGTERM received. Shutting down...");
  await grpcServer.forceShutdown();
  await eventBus.disconnect();
  await prisma.$disconnect();
  process.exit(0);
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default app as any;

