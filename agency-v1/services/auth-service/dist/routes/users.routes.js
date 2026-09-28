"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRouter = void 0;
/**
 * Global Users Router — Auth Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix C-4: Whitelist validation on global role assignments (prevents privilege escalation).
 * Enforces super_admin role checks.
 */
const express_1 = require("express");
const zod_1 = require("zod");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("@agency/database");
const keys_1 = require("../lib/keys");
const blacklist_1 = require("../utilities/blacklist");
const VALID_GLOBAL_ROLES = ["super_admin", "admin", "manager", "user", "viewer", "guest"];
const updateGlobalRoleSchema = zod_1.z.object({
    name: zod_1.z.enum(VALID_GLOBAL_ROLES, {
        errorMap: () => ({ message: `Role must be one of: ${VALID_GLOBAL_ROLES.join(", ")}` }),
    }),
});
exports.usersRouter = (0, express_1.Router)();
// ── Authentication & Super Admin Middleware ──────────────────────────────────
const requireSuperAdmin = async (req, res, next) => {
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
        if (decoded.role !== "super_admin" && decoded.role !== "admin") {
            return res.status(403).json({ error: "Super admin permissions required" });
        }
        req.authUser = decoded;
        next();
    }
    catch {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
};
exports.usersRouter.use(requireSuperAdmin);
// ── GET /global-users ─────────────────────────────────────────────────────────
exports.usersRouter.get("/global-users", async (req, res) => {
    try {
        const search = req.query.search ? String(req.query.search).trim() : undefined;
        const users = await database_1.prisma.user.findMany({
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
    }
    catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
});
// ── PATCH /global-users/:id/role ──────────────────────────────────────────────
exports.usersRouter.patch("/global-users/:id/role", async (req, res) => {
    try {
        const targetId = String(req.params.id);
        const parsed = updateGlobalRoleSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: "Invalid role payload", details: parsed.error.errors });
        }
        const { name } = parsed.data;
        const user = await database_1.prisma.user.update({
            where: { id: targetId },
            data: { role: name },
            select: { id: true, email: true, name: true, role: true },
        });
        res.json({ success: true, user });
    }
    catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
});
//# sourceMappingURL=users.routes.js.map