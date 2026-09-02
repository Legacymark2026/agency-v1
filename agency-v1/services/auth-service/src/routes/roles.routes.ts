/**
 * Roles & Permissions Router — Auth Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix C-3: Strict multi-tenant verification preventing cross-company RBAC leakage.
 * Fix C-4: Zod validation on role creation and updates.
 * Fix 9: Express 5 safe parameter parsing.
 */
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { prisma } from "@agency/database";
import { getCryptoKeys } from "../lib/keys";
import { redisClient } from "../lib/event-bus.singleton";
import { isTokenRevoked } from "../utilities/blacklist";

const createRoleSchema = z.object({
  name: z.string().min(1, "Role name required"),
  companyId: z.string().min(1, "companyId required"),
  description: z.string().optional().nullable(),
  permissionIds: z.array(z.string()).default([]),
});

const updateRoleSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  permissionIds: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

const assignRoleSchema = z.object({
  userId: z.string().min(1, "userId required"),
  companyId: z.string().min(1, "companyId required"),
  roleName: z.string().min(1, "roleName required"),
});

export const rolesRouter = Router();

// ── Authentication Middleware ────────────────────────────────────────────────
const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
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

    (req as any).authUser = {
      id: decoded.sub,
      role: decoded.role,
      email: decoded.email,
      companyId: decoded.companyId,
    };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).authUser;
  if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
    return res.status(403).json({ error: "Insufficient permissions" });
  }
  next();
};

rolesRouter.use(requireAuth);

// ── Multi-tenant Helper Guard ─────────────────────────────────────────────────
async function canAccessCompany(userId: string, userRole: string, targetCompanyId: string): Promise<boolean> {
  if (userRole === "super_admin") return true;
  const membership = await (prisma as any).companyUser.findFirst({
    where: { userId, companyId: targetCompanyId },
  });
  return !!membership;
}

// ── GET /roles/:companyId ─────────────────────────────────────────────────────
rolesRouter.get("/roles/:companyId", async (req: Request, res: Response) => {
  try {
    const companyId = String(req.params.companyId);
    const user = (req as any).authUser;

    const allowed = await canAccessCompany(user.id, user.role, companyId);
    if (!allowed) {
      return res.status(403).json({ error: "Access denied: unauthorized for this company" });
    }

    const roles = await prisma.role.findMany({
      where: { companyId, isActive: true },
      include: { permissions: { include: { permission: true } } },
    });

    res.json({ roles });
  } catch (err: any) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── GET /roles/full/:companyId ────────────────────────────────────────────────
rolesRouter.get("/roles/full/:companyId", async (req: Request, res: Response) => {
  try {
    const companyId = String(req.params.companyId);
    const user = (req as any).authUser;

    const allowed = await canAccessCompany(user.id, user.role, companyId);
    if (!allowed) {
      return res.status(403).json({ error: "Access denied: unauthorized for this company" });
    }

    const roles = await prisma.role.findMany({
      where: { companyId },
      include: {
        permissions: { include: { permission: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    const members = await (prisma as any).companyUser.findMany({
      where: { companyId },
      select: { userId: true, roleName: true },
    });

    const rolesWithCounts = roles.map((r) => ({
      ...r,
      userCount: members.filter((m: any) => m.roleName === r.name).length,
      permissionCount: r.permissions.length,
    }));

    res.json({ success: true, roles: rolesWithCounts });
  } catch (err: any) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── GET /roles/:id/detail ─────────────────────────────────────────────────────
rolesRouter.get("/roles/:id/detail", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const role = await prisma.role.findUnique({
      where: { id },
      include: { permissions: { include: { permission: true } } },
    });

    if (!role) return res.status(404).json({ error: "Role not found" });

    const user = (req as any).authUser;
    const allowed = await canAccessCompany(user.id, user.role, role.companyId);
    if (!allowed) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({ success: true, role });
  } catch (err: any) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── POST /roles ───────────────────────────────────────────────────────────────
rolesRouter.post("/roles", requireAdmin, async (req: Request, res: Response) => {
  try {
    const parsed = createRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Validation failed", details: parsed.error.errors });
    }

    const { name, companyId, description, permissionIds } = parsed.data;

    const user = (req as any).authUser;
    const allowed = await canAccessCompany(user.id, user.role, companyId);
    if (!allowed) {
      return res.status(403).json({ error: "Access denied for this company" });
    }

    const role = await prisma.role.create({
      data: {
        name,
        companyId,
        description,
        permissions: {
          create: permissionIds.map((pId) => ({ permissionId: pId })),
        },
      },
      include: { permissions: { include: { permission: true } } },
    });

    res.status(201).json({ success: true, role });
  } catch (err: any) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── PATCH /roles/:id ──────────────────────────────────────────────────────────
rolesRouter.patch("/roles/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const existing = await prisma.role.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Role not found" });

    const user = (req as any).authUser;
    const allowed = await canAccessCompany(user.id, user.role, existing.companyId);
    if (!allowed) return res.status(403).json({ error: "Access denied" });

    const parsed = updateRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Validation failed", details: parsed.error.errors });
    }

    const { name, description, permissionIds, isActive } = parsed.data;

    const role = await prisma.$transaction(async (tx) => {
      if (permissionIds !== undefined) {
        await tx.rolePermission.deleteMany({ where: { roleId: id } });
        await tx.rolePermission.createMany({
          data: permissionIds.map((pId) => ({ roleId: id, permissionId: pId })),
        });
      }

      return tx.role.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(isActive !== undefined && { isActive }),
        },
        include: { permissions: { include: { permission: true } } },
      });
    });

    res.json({ success: true, role });
  } catch (err: any) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── DELETE /roles/:id ─────────────────────────────────────────────────────────
rolesRouter.delete("/roles/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const existing = await prisma.role.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Role not found" });

    const user = (req as any).authUser;
    const allowed = await canAccessCompany(user.id, user.role, existing.companyId);
    if (!allowed) return res.status(403).json({ error: "Access denied" });

    await prisma.role.delete({ where: { id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── PATCH /assign-role ────────────────────────────────────────────────────────
rolesRouter.patch("/assign-role", requireAdmin, async (req: Request, res: Response) => {
  try {
    const parsed = assignRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Validation failed", details: parsed.error.errors });
    }

    const { userId, companyId, roleName } = parsed.data;
    const user = (req as any).authUser;
    const allowed = await canAccessCompany(user.id, user.role, companyId);
    if (!allowed) return res.status(403).json({ error: "Access denied" });

    const updated = await (prisma as any).companyUser.upsert({
      where: {
        companyId_userId: { companyId, userId },
      },
      update: { roleName },
      create: { companyId, userId, roleName },
    });

    res.json({ success: true, membership: updated });
  } catch (err: any) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── GET /users-with-roles/:companyId ──────────────────────────────────────────
rolesRouter.get("/users-with-roles/:companyId", async (req: Request, res: Response) => {
  try {
    const companyId = String(req.params.companyId);
    const user = (req as any).authUser;
    const allowed = await canAccessCompany(user.id, user.role, companyId);
    if (!allowed) return res.status(403).json({ error: "Access denied" });

    const companyUsers = await (prisma as any).companyUser.findMany({
      where: { companyId },
    });

    const userIds = companyUsers.map((cu: any) => cu.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, image: true, role: true },
    });

    const result = users.map((u) => {
      const cu = companyUsers.find((c: any) => c.userId === u.id);
      return {
        ...u,
        companyRole: cu?.roleName || "member",
      };
    });

    res.json({ success: true, users: result });
  } catch (err: any) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Permissions Sync & Role Configs ───────────────────────────────────────────
rolesRouter.get("/permissions", async (_req: Request, res: Response) => {
  try {
    const permissions = await prisma.permission.findMany({ orderBy: { category: "asc" } });
    res.json({ success: true, permissions });
  } catch (err: any) {
    res.status(500).json({ error: "Internal server error" });
  }
});

rolesRouter.post("/permissions/sync", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { permissions } = req.body;
    if (!Array.isArray(permissions)) return res.status(400).json({ error: "permissions array required" });

    const synced: any[] = [];
    for (const p of permissions) {
      const upserted = await prisma.permission.upsert({
        where: { name: p.name },
        update: { description: p.description, category: p.category },
        create: { name: p.name, description: p.description, category: p.category || "GENERAL" },
      });
      synced.push(upserted);
    }

    res.json({ success: true, count: synced.length, permissions: synced });
  } catch (err: any) {
    res.status(500).json({ error: "Internal server error" });
  }
});

rolesRouter.get("/role-configs", async (_req: Request, res: Response) => {
  try {
    const configs = await prisma.roleConfig.findMany();
    res.json({ success: true, configs });
  } catch (err: any) {
    res.status(500).json({ error: "Internal server error" });
  }
});

rolesRouter.post("/role-configs", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { roleName, allowedRoutes, description } = req.body;
    if (!roleName || !Array.isArray(allowedRoutes)) {
      return res.status(400).json({ error: "roleName and allowedRoutes required" });
    }

    const config = await prisma.roleConfig.upsert({
      where: { roleName },
      update: { allowedRoutes, description },
      create: { roleName, allowedRoutes, description },
    });

    res.json({ success: true, config });
  } catch (err: any) {
    res.status(500).json({ error: "Internal server error" });
  }
});

rolesRouter.delete("/role-configs/:roleName", requireAdmin, async (req: Request, res: Response) => {
  try {
    const roleName = String(req.params.roleName);
    await prisma.roleConfig.delete({ where: { roleName } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Internal server error" });
  }
});
