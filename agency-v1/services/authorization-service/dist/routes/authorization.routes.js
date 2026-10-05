"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthorizationRouter = createAuthorizationRouter;
const express_1 = require("express");
const zod_1 = require("zod");
const createRoleSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Role name required"),
    companyId: zod_1.z.string().min(1, "companyId required"),
    description: zod_1.z.string().optional().nullable(),
    permissionIds: zod_1.z.array(zod_1.z.string()).default([]),
    priority: zod_1.z.number().optional(),
    isDefault: zod_1.z.boolean().optional(),
});
const updateRoleSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().nullable().optional(),
    permissionIds: zod_1.z.array(zod_1.z.string()).optional(),
    isActive: zod_1.z.boolean().optional(),
    priority: zod_1.z.number().optional(),
    isDefault: zod_1.z.boolean().optional(),
});
const assignRoleSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1, "userId required"),
    companyId: zod_1.z.string().min(1, "companyId required"),
    roleName: zod_1.z.string().min(1, "roleName required"),
});
function createAuthorizationRouter(useCases) {
    const router = (0, express_1.Router)();
    const getActorContext = (req) => {
        const userId = req.headers["x-user-id"] || req.user?.id;
        const companyId = req.headers["x-company-id"] || req.user?.companyId;
        const role = req.headers["x-user-role"] || req.user?.role || "user";
        const isSuperAdmin = role === "super_admin" || role === "SUPER_ADMIN";
        return { userId, companyId, role, isSuperAdmin };
    };
    const requireAdmin = (req, res, next) => {
        const { role, isSuperAdmin } = getActorContext(req);
        if (!isSuperAdmin && role !== "admin" && role !== "ADMIN") {
            res.status(403).json({ success: false, error: "Administrative rights required" });
            return;
        }
        next();
    };
    // ── GET /roles/:companyId ───────────────────────────────────────────────────
    router.get("/roles/:companyId", async (req, res) => {
        try {
            const companyId = String(req.params.companyId);
            const actor = getActorContext(req);
            const roles = await useCases.getRolesByCompany(companyId, actor.companyId, actor.isSuperAdmin);
            res.json({ success: true, roles });
        }
        catch (err) {
            const status = err.message.includes("Access denied") ? 403 : 500;
            res.status(status).json({ success: false, error: err.message });
        }
    });
    // ── GET /roles/full/:companyId ──────────────────────────────────────────────
    router.get("/roles/full/:companyId", async (req, res) => {
        try {
            const companyId = String(req.params.companyId);
            const actor = getActorContext(req);
            const roles = await useCases.getRolesByCompany(companyId, actor.companyId, actor.isSuperAdmin);
            res.json({ success: true, roles });
        }
        catch (err) {
            const status = err.message.includes("Access denied") ? 403 : 500;
            res.status(status).json({ success: false, error: err.message });
        }
    });
    // ── GET /roles/:id/detail ───────────────────────────────────────────────────
    router.get("/roles/:id/detail", async (req, res) => {
        try {
            const id = String(req.params.id);
            const actor = getActorContext(req);
            const role = await useCases.getRoleDetail(id, actor.companyId, actor.isSuperAdmin);
            if (!role) {
                res.status(404).json({ success: false, error: "Role not found" });
                return;
            }
            res.json({ success: true, role });
        }
        catch (err) {
            const status = err.message.includes("Access denied") ? 403 : 500;
            res.status(status).json({ success: false, error: err.message });
        }
    });
    // ── POST /roles ─────────────────────────────────────────────────────────────
    router.post("/roles", requireAdmin, async (req, res) => {
        try {
            const parsed = createRoleSchema.parse(req.body);
            const actor = getActorContext(req);
            const role = await useCases.createRole(parsed, actor.companyId, actor.isSuperAdmin);
            res.status(201).json({ success: true, role });
        }
        catch (err) {
            if (err instanceof zod_1.z.ZodError) {
                res.status(400).json({ success: false, error: "Validation failed", details: err.errors });
                return;
            }
            const status = err.message.includes("Access denied") ? 403 : 500;
            res.status(status).json({ success: false, error: err.message });
        }
    });
    // ── PATCH /roles/:id ────────────────────────────────────────────────────────
    router.patch("/roles/:id", requireAdmin, async (req, res) => {
        try {
            const id = String(req.params.id);
            const parsed = updateRoleSchema.parse(req.body);
            const actor = getActorContext(req);
            const role = await useCases.updateRole(id, parsed, actor.companyId, actor.isSuperAdmin);
            res.json({ success: true, role });
        }
        catch (err) {
            if (err instanceof zod_1.z.ZodError) {
                res.status(400).json({ success: false, error: "Validation failed", details: err.errors });
                return;
            }
            const status = err.message.includes("Access denied") ? 403 : 500;
            res.status(status).json({ success: false, error: err.message });
        }
    });
    // ── DELETE /roles/:id ───────────────────────────────────────────────────────
    router.delete("/roles/:id", requireAdmin, async (req, res) => {
        try {
            const id = String(req.params.id);
            const actor = getActorContext(req);
            const ok = await useCases.deleteRole(id, actor.companyId, actor.isSuperAdmin);
            if (!ok) {
                res.status(404).json({ success: false, error: "Role not found" });
                return;
            }
            res.json({ success: true, message: "Role deleted successfully" });
        }
        catch (err) {
            const status = err.message.includes("Access denied") ? 403 : 500;
            res.status(status).json({ success: false, error: err.message });
        }
    });
    // ── PATCH /assign-role ──────────────────────────────────────────────────────
    router.patch("/assign-role", requireAdmin, async (req, res) => {
        try {
            const parsed = assignRoleSchema.parse(req.body);
            const actor = getActorContext(req);
            const membership = await useCases.assignUserRole(parsed, actor.companyId, actor.isSuperAdmin);
            res.json({ success: true, membership });
        }
        catch (err) {
            if (err instanceof zod_1.z.ZodError) {
                res.status(400).json({ success: false, error: "Validation failed", details: err.errors });
                return;
            }
            const status = err.message.includes("Access denied") ? 403 : 500;
            res.status(status).json({ success: false, error: err.message });
        }
    });
    // ── GET /users-with-roles/:companyId ────────────────────────────────────────
    router.get("/users-with-roles/:companyId", async (req, res) => {
        try {
            const companyId = String(req.params.companyId);
            const actor = getActorContext(req);
            const users = await useCases.listUsersWithRoles(companyId, actor.companyId, actor.isSuperAdmin);
            res.json({ success: true, users });
        }
        catch (err) {
            const status = err.message.includes("Access denied") ? 403 : 500;
            res.status(status).json({ success: false, error: err.message });
        }
    });
    // ── Permissions Catalog ─────────────────────────────────────────────────────
    router.get("/permissions", async (_req, res) => {
        try {
            const permissions = await useCases.listPermissions();
            res.json({ success: true, permissions });
        }
        catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });
    router.post("/permissions/sync", requireAdmin, async (req, res) => {
        try {
            const permissions = req.body.permissions;
            if (!Array.isArray(permissions)) {
                res.status(400).json({ success: false, error: "permissions array required" });
                return;
            }
            const synced = await useCases.syncPermissions(permissions);
            res.json({ success: true, count: synced.length, permissions: synced });
        }
        catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });
    // ── Role Configs ────────────────────────────────────────────────────────────
    router.get("/role-configs", async (_req, res) => {
        try {
            const configs = await useCases.listRoleConfigs();
            res.json({ success: true, configs });
        }
        catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });
    router.post("/role-configs", requireAdmin, async (req, res) => {
        try {
            const { roleName, allowedRoutes, description } = req.body;
            if (!roleName || !Array.isArray(allowedRoutes)) {
                res.status(400).json({ success: false, error: "roleName and allowedRoutes array required" });
                return;
            }
            const config = await useCases.upsertRoleConfig({ roleName, allowedRoutes, description });
            res.json({ success: true, config });
        }
        catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });
    router.delete("/role-configs/:roleName", requireAdmin, async (req, res) => {
        try {
            const roleName = String(req.params.roleName);
            await useCases.deleteRoleConfig(roleName);
            res.json({ success: true, message: `Role config ${roleName} deleted` });
        }
        catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });
    // ── POST /check-permission (Gatekeeper & RBAC Evaluation) ───────────────────
    router.post("/check-permission", async (req, res) => {
        try {
            const { userId, companyId, requiredPermission, userRole, requiredTier, skipSubscriptionCheck, } = req.body;
            if (!requiredPermission) {
                res.status(400).json({ success: false, error: "requiredPermission is required" });
                return;
            }
            const actor = getActorContext(req);
            const targetCompanyId = companyId || actor.companyId;
            const targetUserId = userId || actor.userId;
            const targetRole = userRole || actor.role;
            const result = await useCases.checkPermission({
                userId: targetUserId,
                companyId: targetCompanyId,
                requiredPermission,
                userRole: targetRole,
                isSuperAdmin: actor.isSuperAdmin,
                requiredTier,
                skipSubscriptionCheck: Boolean(skipSubscriptionCheck),
            });
            const statusCode = result.granted ? 200 : 403;
            res.status(statusCode).json({
                success: result.granted,
                granted: result.granted,
                reason: result.reason,
                subscriptionCheck: result.subscriptionCheck,
            });
        }
        catch (err) {
            res.status(500).json({ success: false, granted: false, error: err.message });
        }
    });
    return router;
}
