"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rolesRouter = void 0;
/**
 * Roles & Permissions Router — Auth Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix C-3: Strict multi-tenant verification preventing cross-company RBAC leakage.
 * Fix C-4: Zod validation on role creation and updates.
 * Fix 9: Express 5 safe parameter parsing.
 */
const express_1 = require("express");
const zod_1 = require("zod");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("@agency/database");
const keys_1 = require("../lib/keys");
const blacklist_1 = require("../utilities/blacklist");
const createRoleSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Role name required"),
    companyId: zod_1.z.string().min(1, "companyId required"),
    description: zod_1.z.string().optional().nullable(),
    permissionIds: zod_1.z.array(zod_1.z.string()).default([]),
});
const updateRoleSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().nullable().optional(),
    permissionIds: zod_1.z.array(zod_1.z.string()).optional(),
    isActive: zod_1.z.boolean().optional(),
});
const assignRoleSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1, "userId required"),
    companyId: zod_1.z.string().min(1, "companyId required"),
    roleName: zod_1.z.string().min(1, "roleName required"),
});
exports.rolesRouter = (0, express_1.Router)();
// ── Authentication Middleware ────────────────────────────────────────────────
const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Authentication required" });
        }
        const token = authHeader.slice(7);
        const isRevoked = await (0, blacklist_1.isTokenRevoked)(token);
        if (isRevoked)
            return res.status(401).json({ error: "Token revoked" });
        const { publicKey } = (0, keys_1.getCryptoKeys)();
        const verifyKey = publicKey || process.env.JWT_SECRET;
        if (!verifyKey)
            return res.status(500).json({ error: "Auth misconfigured" });
        const decoded = jsonwebtoken_1.default.verify(token, verifyKey, {
            ...(publicKey ? { algorithms: ["RS256"] } : {}),
        });
        req.authUser = {
            id: decoded.sub,
            role: decoded.role,
            email: decoded.email,
            companyId: decoded.companyId,
        };
        next();
    }
    catch {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
};
const requireAdmin = async (req, res, next) => {
    const user = req.authUser;
    if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
        return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
};
exports.rolesRouter.use(requireAuth);
// ── Multi-tenant Helper Guard ─────────────────────────────────────────────────
async function canAccessCompany(userId, userRole, targetCompanyId) {
    if (userRole === "super_admin")
        return true;
    const membership = await database_1.prisma.companyUser.findFirst({
        where: { userId, companyId: targetCompanyId },
    });
    return !!membership;
}
// ── GET /roles/:companyId ─────────────────────────────────────────────────────
exports.rolesRouter.get("/roles/:companyId", async (req, res) => {
    try {
        const companyId = String(req.params.companyId);
        const user = req.authUser;
        const allowed = await canAccessCompany(user.id, user.role, companyId);
        if (!allowed) {
            return res.status(403).json({ error: "Access denied: unauthorized for this company" });
        }
        const roles = await database_1.prisma.role.findMany({
            where: { companyId, isActive: true },
            include: { permissions: { include: { permission: true } } },
        });
        res.json({ roles });
    }
    catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
});
// ── GET /roles/full/:companyId ────────────────────────────────────────────────
exports.rolesRouter.get("/roles/full/:companyId", async (req, res) => {
    try {
        const companyId = String(req.params.companyId);
        const user = req.authUser;
        const allowed = await canAccessCompany(user.id, user.role, companyId);
        if (!allowed) {
            return res.status(403).json({ error: "Access denied: unauthorized for this company" });
        }
        const roles = await database_1.prisma.role.findMany({
            where: { companyId },
            include: {
                permissions: { include: { permission: true } },
            },
            orderBy: { createdAt: "asc" },
        });
        const members = await database_1.prisma.companyUser.findMany({
            where: { companyId },
            select: { userId: true, roleName: true },
        });
        const rolesWithCounts = roles.map((r) => ({
            ...r,
            userCount: members.filter((m) => m.roleName === r.name).length,
            permissionCount: r.permissions.length,
        }));
        res.json({ success: true, roles: rolesWithCounts });
    }
    catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
});
// ── GET /roles/:id/detail ─────────────────────────────────────────────────────
exports.rolesRouter.get("/roles/:id/detail", async (req, res) => {
    try {
        const id = String(req.params.id);
        const role = await database_1.prisma.role.findUnique({
            where: { id },
            include: { permissions: { include: { permission: true } } },
        });
        if (!role)
            return res.status(404).json({ error: "Role not found" });
        const user = req.authUser;
        const allowed = await canAccessCompany(user.id, user.role, role.companyId);
        if (!allowed) {
            return res.status(403).json({ error: "Access denied" });
        }
        res.json({ success: true, role });
    }
    catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
});
// ── POST /roles ───────────────────────────────────────────────────────────────
exports.rolesRouter.post("/roles", requireAdmin, async (req, res) => {
    try {
        const parsed = createRoleSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: "Validation failed", details: parsed.error.errors });
        }
        const { name, companyId, description, permissionIds } = parsed.data;
        const user = req.authUser;
        const allowed = await canAccessCompany(user.id, user.role, companyId);
        if (!allowed) {
            return res.status(403).json({ error: "Access denied for this company" });
        }
        const role = await database_1.prisma.role.create({
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
    }
    catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
});
// ── PATCH /roles/:id ──────────────────────────────────────────────────────────
exports.rolesRouter.patch("/roles/:id", requireAdmin, async (req, res) => {
    try {
        const id = String(req.params.id);
        const existing = await database_1.prisma.role.findUnique({ where: { id } });
        if (!existing)
            return res.status(404).json({ error: "Role not found" });
        const user = req.authUser;
        const allowed = await canAccessCompany(user.id, user.role, existing.companyId);
        if (!allowed)
            return res.status(403).json({ error: "Access denied" });
        const parsed = updateRoleSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: "Validation failed", details: parsed.error.errors });
        }
        const { name, description, permissionIds, isActive } = parsed.data;
        const role = await database_1.prisma.$transaction(async (tx) => {
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
    }
    catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
});
// ── DELETE /roles/:id ─────────────────────────────────────────────────────────
exports.rolesRouter.delete("/roles/:id", requireAdmin, async (req, res) => {
    try {
        const id = String(req.params.id);
        const existing = await database_1.prisma.role.findUnique({ where: { id } });
        if (!existing)
            return res.status(404).json({ error: "Role not found" });
        const user = req.authUser;
        const allowed = await canAccessCompany(user.id, user.role, existing.companyId);
        if (!allowed)
            return res.status(403).json({ error: "Access denied" });
        await database_1.prisma.role.delete({ where: { id } });
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
});
// ── PATCH /assign-role ────────────────────────────────────────────────────────
exports.rolesRouter.patch("/assign-role", requireAdmin, async (req, res) => {
    try {
        const parsed = assignRoleSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: "Validation failed", details: parsed.error.errors });
        }
        const { userId, companyId, roleName } = parsed.data;
        const user = req.authUser;
        const allowed = await canAccessCompany(user.id, user.role, companyId);
        if (!allowed)
            return res.status(403).json({ error: "Access denied" });
        const updated = await database_1.prisma.companyUser.upsert({
            where: {
                companyId_userId: { companyId, userId },
            },
            update: { roleName },
            create: { companyId, userId, roleName },
        });
        res.json({ success: true, membership: updated });
    }
    catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
});
// ── GET /users-with-roles/:companyId ──────────────────────────────────────────
exports.rolesRouter.get("/users-with-roles/:companyId", async (req, res) => {
    try {
        const companyId = String(req.params.companyId);
        const user = req.authUser;
        const allowed = await canAccessCompany(user.id, user.role, companyId);
        if (!allowed)
            return res.status(403).json({ error: "Access denied" });
        const companyUsers = await database_1.prisma.companyUser.findMany({
            where: { companyId },
        });
        const userIds = companyUsers.map((cu) => cu.userId);
        const users = await database_1.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, email: true, image: true, role: true },
        });
        const result = users.map((u) => {
            const cu = companyUsers.find((c) => c.userId === u.id);
            return {
                ...u,
                companyRole: cu?.roleName || "member",
            };
        });
        res.json({ success: true, users: result });
    }
    catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
});
// ── Permissions Sync & Role Configs ───────────────────────────────────────────
exports.rolesRouter.get("/permissions", async (_req, res) => {
    try {
        const permissions = await database_1.prisma.permission.findMany({ orderBy: { category: "asc" } });
        res.json({ success: true, permissions });
    }
    catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.rolesRouter.post("/permissions/sync", requireAdmin, async (req, res) => {
    try {
        const { permissions } = req.body;
        if (!Array.isArray(permissions))
            return res.status(400).json({ error: "permissions array required" });
        const synced = [];
        for (const p of permissions) {
            const upserted = await database_1.prisma.permission.upsert({
                where: { name: p.name },
                update: { description: p.description, category: p.category },
                create: { name: p.name, description: p.description, category: p.category || "GENERAL" },
            });
            synced.push(upserted);
        }
        res.json({ success: true, count: synced.length, permissions: synced });
    }
    catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.rolesRouter.get("/role-configs", async (_req, res) => {
    try {
        const configs = await database_1.prisma.roleConfig.findMany();
        res.json({ success: true, configs });
    }
    catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.rolesRouter.post("/role-configs", requireAdmin, async (req, res) => {
    try {
        const { roleName, allowedRoutes, description } = req.body;
        if (!roleName || !Array.isArray(allowedRoutes)) {
            return res.status(400).json({ error: "roleName and allowedRoutes required" });
        }
        const config = await database_1.prisma.roleConfig.upsert({
            where: { roleName },
            update: { allowedRoutes, description },
            create: { roleName, allowedRoutes, description },
        });
        res.json({ success: true, config });
    }
    catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.rolesRouter.delete("/role-configs/:roleName", requireAdmin, async (req, res) => {
    try {
        const roleName = String(req.params.roleName);
        await database_1.prisma.roleConfig.delete({ where: { roleName } });
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
});
//# sourceMappingURL=roles.routes.js.map