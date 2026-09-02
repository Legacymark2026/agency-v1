/**
 * Global Users Router — Auth Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix C-4: Whitelist validation on global role assignments (prevents privilege escalation).
 * Enforces super_admin role checks.
 */
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { prisma } from "@agency/database";
import { getCryptoKeys } from "../lib/keys";
import { isTokenRevoked } from "../utilities/blacklist";

const VALID_GLOBAL_ROLES = ["super_admin", "admin", "manager", "user", "viewer", "guest"] as const;

const updateGlobalRoleSchema = z.object({
  name: z.enum(VALID_GLOBAL_ROLES, {
    errorMap: () => ({ message: `Role must be one of: ${VALID_GLOBAL_ROLES.join(", ")}` }),
  }),
});

export const usersRouter = Router();

// ── Authentication & Super Admin Middleware ──────────────────────────────────
const requireSuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const token = authHeader.slice(7);
    const isRevoked = await isTokenRevoked(token);
    if (isRevoked) return res.status(401).json({ error: "Token revoked" });

    const { publicKey } = getCryptoKeys();
    const verifyKey = publicKey || process.env.JWT_SECRET;
    if (!verifyKey) return res.status(500).json({ error: "Auth misconfigured" });

    const decoded = jwt.verify(token, verifyKey, {
      ...(publicKey ? { algorithms: ["RS256"] } : {}),
    }) as any;

    if (decoded.role !== "super_admin" && decoded.role !== "admin") {
      return res.status(403).json({ error: "Super admin permissions required" });
    }

    (req as any).authUser = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

usersRouter.use(requireSuperAdmin);

// ── GET /global-users ─────────────────────────────────────────────────────────
usersRouter.get("/global-users", async (req: Request, res: Response) => {
  try {
    const search = req.query.search ? String(req.query.search).trim() : undefined;
    const users = await prisma.user.findMany({
      where: search ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      } : undefined,
      select: { id: true, name: true, email: true, role: true, image: true, createdAt: true, deactivatedAt: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    res.json({ success: true, users });
  } catch (err: any) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── PATCH /global-users/:id/role ──────────────────────────────────────────────
usersRouter.patch("/global-users/:id/role", async (req: Request, res: Response) => {
  try {
    const targetId = String(req.params.id);
    const parsed = updateGlobalRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid role payload", details: parsed.error.errors });
    }

    const { name } = parsed.data;
    const user = await prisma.user.update({
      where: { id: targetId },
      data: { role: name },
      select: { id: true, email: true, name: true, role: true },
    });

    res.json({ success: true, user });
  } catch (err: any) {
    res.status(500).json({ error: "Internal server error" });
  }
});
