import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AuthorizationUseCases } from "../core/usecases/authorization.usecases";

const createRoleSchema = z.object({
  name: z.string().min(1, "Role name required"),
  companyId: z.string().min(1, "companyId required"),
  description: z.string().optional().nullable(),
  permissionIds: z.array(z.string()).default([]),
  priority: z.number().optional(),
  isDefault: z.boolean().optional(),
});

const updateRoleSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  permissionIds: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  priority: z.number().optional(),
  isDefault: z.boolean().optional(),
});

const assignRoleSchema = z.object({
  userId: z.string().min(1, "userId required"),
  companyId: z.string().min(1, "companyId required"),
  roleName: z.string().min(1, "roleName required"),
});

export function createAuthorizationRouter(useCases: AuthorizationUseCases): Router {
  const router = Router();

  const getActorContext = (req: Request) => {
    const userId = (req.headers["x-user-id"] as string) || (req as any).user?.id;
    const companyId = (req.headers["x-company-id"] as string) || (req as any).user?.companyId;
    const role = (req.headers["x-user-role"] as string) || (req as any).user?.role || "user";
    const isSuperAdmin = role === "super_admin" || role === "SUPER_ADMIN";
    return { userId, companyId, role, isSuperAdmin };
  };

  const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    const { role, isSuperAdmin } = getActorContext(req);
    if (!isSuperAdmin && role !== "admin" && role !== "ADMIN") {
      res.status(403).json({ success: false, error: "Administrative rights required" });
      return;
    }
    next();
  };

  // ── GET /roles/:companyId ───────────────────────────────────────────────────
  router.get("/roles/:companyId", async (req: Request, res: Response) => {
    try {
      const companyId = String(req.params.companyId);
      const actor = getActorContext(req);
      const roles = await useCases.getRolesByCompany(companyId, actor.companyId, actor.isSuperAdmin);
      res.json({ success: true, roles });
    } catch (err: any) {
      const status = err.message.includes("Access denied") ? 403 : 500;
      res.status(status).json({ success: false, error: err.message });
    }
  });

  // ── GET /roles/full/:companyId ──────────────────────────────────────────────
  router.get("/roles/full/:companyId", async (req: Request, res: Response) => {
    try {
      const companyId = String(req.params.companyId);
      const actor = getActorContext(req);
      const roles = await useCases.getRolesByCompany(companyId, actor.companyId, actor.isSuperAdmin);
      res.json({ success: true, roles });
    } catch (err: any) {
      const status = err.message.includes("Access denied") ? 403 : 500;
      res.status(status).json({ success: false, error: err.message });
    }
  });

  // ── GET /roles/:id/detail ───────────────────────────────────────────────────
  router.get("/roles/:id/detail", async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const actor = getActorContext(req);
      const role = await useCases.getRoleDetail(id, actor.companyId, actor.isSuperAdmin);
      if (!role) {
        res.status(404).json({ success: false, error: "Role not found" });
        return;
      }
      res.json({ success: true, role });
    } catch (err: any) {
      const status = err.message.includes("Access denied") ? 403 : 500;
      res.status(status).json({ success: false, error: err.message });
    }
  });

  // ── POST /roles ─────────────────────────────────────────────────────────────
  router.post("/roles", requireAdmin, async (req: Request, res: Response) => {
    try {
      const parsed = createRoleSchema.parse(req.body);
      const actor = getActorContext(req);
      const role = await useCases.createRole(parsed, actor.companyId, actor.isSuperAdmin);
      res.status(201).json({ success: true, role });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ success: false, error: "Validation failed", details: err.errors });
        return;
      }
      const status = err.message.includes("Access denied") ? 403 : 500;
      res.status(status).json({ success: false, error: err.message });
    }
  });

  // ── PATCH /roles/:id ────────────────────────────────────────────────────────
  router.patch("/roles/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const parsed = updateRoleSchema.parse(req.body);
      const actor = getActorContext(req);
      const role = await useCases.updateRole(id, parsed, actor.companyId, actor.isSuperAdmin);
      res.json({ success: true, role });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ success: false, error: "Validation failed", details: err.errors });
        return;
      }
      const status = err.message.includes("Access denied") ? 403 : 500;
      res.status(status).json({ success: false, error: err.message });
    }
  });

  // ── DELETE /roles/:id ───────────────────────────────────────────────────────
  router.delete("/roles/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const actor = getActorContext(req);
      const ok = await useCases.deleteRole(id, actor.companyId, actor.isSuperAdmin);
      if (!ok) {
        res.status(404).json({ success: false, error: "Role not found" });
        return;
      }
      res.json({ success: true, message: "Role deleted successfully" });
    } catch (err: any) {
      const status = err.message.includes("Access denied") ? 403 : 500;
      res.status(status).json({ success: false, error: err.message });
    }
  });

  // ── PATCH /assign-role ──────────────────────────────────────────────────────
  router.patch("/assign-role", requireAdmin, async (req: Request, res: Response) => {
    try {
      const parsed = assignRoleSchema.parse(req.body);
      const actor = getActorContext(req);
      const membership = await useCases.assignUserRole(parsed, actor.companyId, actor.isSuperAdmin);
      res.json({ success: true, membership });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ success: false, error: "Validation failed", details: err.errors });
        return;
      }
      const status = err.message.includes("Access denied") ? 403 : 500;
      res.status(status).json({ success: false, error: err.message });
    }
  });

  // ── GET /users-with-roles/:companyId ────────────────────────────────────────
  router.get("/users-with-roles/:companyId", async (req: Request, res: Response) => {
    try {
      const companyId = String(req.params.companyId);
      const actor = getActorContext(req);
      const users = await useCases.listUsersWithRoles(companyId, actor.companyId, actor.isSuperAdmin);
      res.json({ success: true, users });
    } catch (err: any) {
      const status = err.message.includes("Access denied") ? 403 : 500;
      res.status(status).json({ success: false, error: err.message });
    }
  });

  // ── Permissions Catalog ─────────────────────────────────────────────────────
  router.get("/permissions", async (_req: Request, res: Response) => {
    try {
      const permissions = await useCases.listPermissions();
      res.json({ success: true, permissions });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post("/permissions/sync", requireAdmin, async (req: Request, res: Response) => {
    try {
      const permissions = req.body.permissions;
      if (!Array.isArray(permissions)) {
        res.status(400).json({ success: false, error: "permissions array required" });
        return;
      }
      const synced = await useCases.syncPermissions(permissions);
      res.json({ success: true, count: synced.length, permissions: synced });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ── Role Configs ────────────────────────────────────────────────────────────
  router.get("/role-configs", async (_req: Request, res: Response) => {
    try {
      const configs = await useCases.listRoleConfigs();
      res.json({ success: true, configs });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post("/role-configs", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { roleName, allowedRoutes, description } = req.body;
      if (!roleName || !Array.isArray(allowedRoutes)) {
        res.status(400).json({ success: false, error: "roleName and allowedRoutes array required" });
        return;
      }
      const config = await useCases.upsertRoleConfig({ roleName, allowedRoutes, description });
      res.json({ success: true, config });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.delete("/role-configs/:roleName", requireAdmin, async (req: Request, res: Response) => {
    try {
      const roleName = String(req.params.roleName);
      await useCases.deleteRoleConfig(roleName);
      res.json({ success: true, message: `Role config ${roleName} deleted` });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}
