/**
 * Core Authentication Router — Auth Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Unifies login, session management, token refresh, revocation & JWKS.
 * Implements ISO 27001 brute force rate limiting, DPoP proof verification (RFC 9449),
 * and RS256 token signing.
 */
import { Router, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@agency/database";
import { getCryptoKeys } from "../lib/keys";
import { redisClient } from "../lib/event-bus.singleton";
import { isTokenRevoked } from "../utilities/blacklist";
import { verifyDPoPProof } from "../utilities/dpop";
import { validateRequest } from "../middlewares/auth.middleware";
import { loginSchema } from "../validators/auth.validators";

export const authRouter = Router();

// ── Helper: Audit Activity Log ────────────────────────────────────────────────
async function logActivity(
  userId: string | null,
  action: string,
  details: Record<string, unknown>,
  req: Request
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
    // Non-critical logging failure
  }
}

// ── JWKS Endpoint (JSON Web Key Set - Inter-service Public Key Verification) ──
authRouter.get("/.well-known/jwks.json", (_req: Request, res: Response) => {
  try {
    const { publicKey } = getCryptoKeys();
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

// ── POST /login ───────────────────────────────────────────────────────────────
authRouter.post("/login", validateRequest(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const clientIp = req.ip || req.headers["x-forwarded-for"] || "unknown";
    const emailLower = email.toLowerCase().trim();

    // Rate Limiting (ISO 27001 A.12.1 — Brute Force Protection)
    const rateLimitKey = `ratelimit:login:${clientIp}:${emailLower}`;
    const attempts = await redisClient.incr(rateLimitKey);
    if (attempts === 1) {
      await redisClient.expire(rateLimitKey, 300); // 5 minute window
    }
    if (attempts > 5) {
      await logActivity(null, "login_blocked_rate_limit", { email: emailLower, ip: clientIp, attempts }, req);
      return res.status(429).json({
        error: "Too many failed login attempts. Account temporarily locked for 5 minutes for security.",
      });
    }

    // Step 1: Fetch user from AUTH DB
    const user = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (!user || !user.passwordHash) {
      await logActivity(null, "login_failed", { email: emailLower, reason: "user_not_found" }, req);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      await logActivity(user.id, "login_failed", { email: emailLower, reason: "invalid_password" }, req);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (user.deactivatedAt) {
      await logActivity(user.id, "login_failed", { email: emailLower, reason: "account_deactivated" }, req);
      return res.status(403).json({ error: "Account deactivated" });
    }

    // Clear rate limit on successful authentication
    await redisClient.del(rateLimitKey);

    // Step 2: Fetch company memberships
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
      console.warn("[auth-service] Could not fetch company memberships for user:", user.id, err);
    }

    // DPoP Validation (RFC 9449)
    const dpopHeader = req.headers.dpop as string;
    let dpopConfirmation: any = undefined;

    if (dpopHeader) {
      const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
      const verification = await verifyDPoPProof(dpopHeader, req.method, fullUrl);
      if (!verification.success) {
        return res.status(400).json({ error: `DPoP proof verification failed: ${verification.error}` });
      }
      dpopConfirmation = { jkt: verification.thumbprint };
    }

    // Sign JWT with RS256 Keystore
    const { privateKey } = getCryptoKeys();
    const signKey = privateKey || process.env.JWT_SECRET;
    if (!signKey) {
      return res.status(500).json({ error: "Authentication service misconfigured" });
    }

    const primaryMembership = companyMemberships[0];
    const tokenPayload: Record<string, unknown> = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role || "user",
      companyId: primaryMembership?.companyId ?? null,
      companyName: primaryMembership?.company?.name ?? null,
      companyRole: primaryMembership?.roleName ?? null,
      companies: companyMemberships.map((m) => ({
        companyId: m.companyId,
        companyName: m.company?.name,
        role: m.roleName,
      })),
      ...(dpopConfirmation ? { cnf: dpopConfirmation } : {}),
    };

    const signOptions: jwt.SignOptions = {
      expiresIn: "1h",
      keyid: "auth-service-rs256-key-1",
      ...(privateKey ? { algorithm: "RS256" } : {}),
    };

    const token = jwt.sign(tokenPayload, signKey, signOptions);

    // Create session record in database
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await prisma.session.create({
      data: {
        sessionToken,
        userId: user.id,
        expires: expiresAt,
      },
    }).catch(() => {});

    await logActivity(user.id, "login_success", { email: user.email, dpop: !!dpopHeader }, req);

    res.json({
      token,
      sessionToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        image: user.image,
      },
      companies: companyMemberships.map((m) => ({
        id: m.companyId,
        name: m.company?.name,
        role: m.roleName,
      })),
    });
  } catch (err: any) {
    console.error("[auth-service] Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── GET /me ───────────────────────────────────────────────────────────────────
authRouter.get("/me", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const token = authHeader.slice(7);
    const isRevoked = await isTokenRevoked(token);
    if (isRevoked) {
      return res.status(401).json({ error: "Token revoked" });
    }

    const { publicKey } = getCryptoKeys();
    const verifyKey = publicKey || process.env.JWT_SECRET;
    if (!verifyKey) return res.status(500).json({ error: "Auth misconfigured" });

    const decoded = jwt.verify(token, verifyKey, {
      ...(publicKey ? { algorithms: ["RS256"] } : {}),
    }) as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, email: true, name: true, role: true, image: true, deactivatedAt: true },
    });

    if (!user || user.deactivatedAt) {
      return res.status(401).json({ error: "User not found or deactivated" });
    }

    const companyMemberships = await (prisma as any).companyUser.findMany({
      where: { userId: user.id },
      include: { company: { select: { id: true, name: true } } },
    }).catch(() => []);

    res.json({
      user,
      companies: companyMemberships.map((m: any) => ({
        id: m.companyId,
        name: m.company?.name,
        role: m.roleName,
      })),
    });
  } catch (err: any) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
});

// ── POST /logout ──────────────────────────────────────────────────────────────
authRouter.post("/logout", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const { sessionToken } = req.body;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const hash = crypto.createHash("sha256").update(token).digest("hex");
      await redisClient.set(`jwt:blacklist:${hash}`, "revoked", "EX", 3600);
    }

    if (sessionToken) {
      await prisma.session.deleteMany({
        where: { sessionToken: String(sessionToken) },
      }).catch(() => {});
    }

    res.json({ success: true, message: "Logged out successfully" });
  } catch (err: any) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── POST /validate ────────────────────────────────────────────────────────────
authRouter.post("/validate", async (req: Request, res: Response) => {
  try {
    const { token, dpopProof, httpMethod, httpUrl } = req.body;
    if (!token) return res.status(400).json({ valid: false, error: "Token required" });

    const isRevoked = await isTokenRevoked(token);
    if (isRevoked) {
      return res.status(401).json({ valid: false, error: "Token revoked" });
    }

    const { publicKey } = getCryptoKeys();
    const verifyKey = publicKey || process.env.JWT_SECRET;
    if (!verifyKey) return res.status(500).json({ valid: false, error: "Auth misconfigured" });

    const decoded = jwt.verify(token, verifyKey, {
      ...(publicKey ? { algorithms: ["RS256"] } : {}),
    }) as any;

    if (decoded.cnf?.jkt) {
      if (!dpopProof) {
        return res.status(400).json({ valid: false, error: "DPoP proof required" });
      }
      const verification = await verifyDPoPProof(dpopProof, httpMethod || "POST", httpUrl || "");
      if (!verification.success || verification.thumbprint !== decoded.cnf.jkt) {
        return res.status(400).json({ valid: false, error: "DPoP signature mismatch" });
      }
    }

    res.json({
      valid: true,
      userId: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      companyId: decoded.companyId,
    });
  } catch (err: any) {
    res.status(401).json({ valid: false, error: err.message || "Invalid token" });
  }
});

// ── POST /check-permission ────────────────────────────────────────────────────
authRouter.post("/check-permission", async (req: Request, res: Response) => {
  try {
    const { userId, companyId, permission } = req.body;
    if (!userId || !permission) {
      return res.status(400).json({ allowed: false, error: "userId and permission required" });
    }

    const user = await prisma.user.findUnique({
      where: { id: String(userId) },
      select: { id: true, role: true },
    });

    if (!user) return res.status(404).json({ allowed: false, error: "User not found" });

    // Super admin has unrestricted access
    if (user.role === "super_admin") {
      return res.json({ allowed: true, reason: "super_admin" });
    }

    if (companyId) {
      const membership = await (prisma as any).companyUser.findFirst({
        where: { userId: String(userId), companyId: String(companyId) },
      });

      if (!membership) {
        return res.status(403).json({ allowed: false, error: "User not member of this company" });
      }

      const role = await prisma.role.findFirst({
        where: { name: membership.roleName, companyId: String(companyId) },
        include: { permissions: { include: { permission: true } } },
      });

      const hasPermission = role?.permissions.some((p: any) => p.permission.name === permission) ?? false;
      return res.json({ allowed: hasPermission, role: membership.roleName });
    }

    res.json({ allowed: user.role === "admin", role: user.role });
  } catch (err: any) {
    res.status(500).json({ allowed: false, error: "Internal server error" });
  }
});
