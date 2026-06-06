/**
 * Auth Service — Identity & Access Management Microservice
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles: Authentication, Authorization, RBAC, MFA, Sessions, API Keys
 * Port: 4001
 * 
 * Models: User, Session, Account, Role, Permission, RoleConfig, CompanyUser
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import { prisma } from "@agency/database";
import { EventBus } from "@agency/events";
import Redis from "ioredis";
import fs from "fs";
import path from "path";

const app = express();
const PORT = parseInt(process.env.PORT || "4001", 10);
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const redis = new Redis(REDIS_URL);
redis.on("error", (err) => console.error("[auth-service] Redis error:", err.message));

// Load RS256 keys if present
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
  console.warn("[auth-service] Failed to load RSA keys, falling back to HS256:", err.message);
}

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(",") || "*" }));
app.use(express.json({ limit: "1mb" }));

// ── Health Checks (Required for K8s) ─────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "healthy", service: "auth-service", timestamp: new Date().toISOString() });
});

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

    const user = await prisma.user.findUnique({
      where: { email },
      include: { companies: { include: { company: true, role: true } } },
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const bcrypt = await import("bcryptjs");
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (user.deactivatedAt) {
      return res.status(403).json({ error: "Account deactivated" });
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
        companies: user.companies.map((c) => ({
          companyId: c.companyId,
          roleName: c.roleName,
          companyName: c.company.name,
        })),
      },
      signKey,
      signOptions
    );

    // Create session
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        sessionToken: token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      },
    });

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
    const decoded = jwt.verify(token, verifyKey, verifyOptions) as { exp?: number };
    
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
        _count: { select: { users: true } }
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
    const role = await prisma.role.findUnique({ where: { id: req.params.id }, include: { users: true } });
    if (!role) return res.status(404).json({ error: 'Rol no encontrado' });
    if (role.users.length > 0) return res.status(400).json({ error: 'El rol tiene usuarios asignados' });

    await prisma.rolePermission.deleteMany({ where: { roleId: req.params.id } });
    await prisma.role.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// User Assignment & RBAC Stats
app.patch('/api/auth/assign-role', async (req, res) => {
  try {
    const { userId, companyId, roleId } = req.body;
    const target = await prisma.companyUser.findFirst({ where: { userId, companyId } });
    if (!target) return res.status(400).json({ error: 'El usuario no pertenece a esta empresa' });

    await prisma.companyUser.update({
      where: { id: target.id },
      data: { roleId }
    });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/auth/users-with-roles/:companyId', async (req, res) => {
  try {
    const users = await prisma.companyUser.findMany({
      where: { companyId: req.params.companyId },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        role: { select: { id: true, name: true, priority: true } },
        team: { select: { id: true, name: true } }
      },
      orderBy: [{ joinedAt: 'desc' }]
    });
    res.json(users);
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
    const user = await prisma.user.update({
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

// ── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🔐 Auth Service running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Ready:  http://localhost:${PORT}/ready`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("[auth-service] SIGTERM received. Shutting down...");
  await eventBus.disconnect();
  await prisma.$disconnect();
  process.exit(0);
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default app as any;
