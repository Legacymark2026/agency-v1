"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mfaRouter = void 0;
/**
 * MFA & Security Audit Router — Auth Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix C-2: Protected with requireUserOrServiceAuth.
 * Fix C-4: Zod validation on 2FA actions and backup code verifications.
 */
const express_1 = require("express");
const database_1 = require("@agency/database");
const security_service_1 = require("../services/security.service");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const auth_validators_1 = require("../validators/auth.validators");
function getStr(val) {
    if (!val)
        return "";
    if (Array.isArray(val))
        return String(val[0] || "");
    return String(val);
}
exports.mfaRouter = (0, express_1.Router)();
// ── 🔒 2FA Endpoints ──────────────────────────────────────────────────────────
exports.mfaRouter.post("/2fa/generate", async (req, res, next) => {
    try {
        const userId = getStr(req.body.userId || req.headers["x-user-id"]);
        const email = getStr(req.body.email);
        if (!userId)
            return res.status(400).json({ error: "userId required" });
        const result = await security_service_1.SecurityService.generate2FA(userId, email);
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
exports.mfaRouter.post("/2fa/enable", (0, auth_middleware_1.validateRequest)(auth_validators_1.enable2FASchema), async (req, res, next) => {
    try {
        const userId = getStr(req.body.userId || req.headers["x-user-id"]);
        const { secret, token } = req.body;
        const result = await security_service_1.SecurityService.enable2FA(userId, getStr(secret), getStr(token), req.ip, getStr(req.headers["user-agent"]));
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
exports.mfaRouter.post("/2fa/verify", (0, auth_middleware_1.validateRequest)(auth_validators_1.verify2FASchema), async (req, res, next) => {
    try {
        const userId = getStr(req.body.userId || req.headers["x-user-id"]);
        const { tokenOrBackupCode } = req.body;
        const result = await security_service_1.SecurityService.verify2FA(userId, getStr(tokenOrBackupCode), req.ip, getStr(req.headers["user-agent"]));
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
exports.mfaRouter.post("/2fa/disable", (0, auth_middleware_1.validateRequest)(auth_validators_1.disable2FASchema), async (req, res, next) => {
    try {
        const userId = getStr(req.body.userId || req.headers["x-user-id"]);
        const result = await security_service_1.SecurityService.disable2FA(userId, req.ip, getStr(req.headers["user-agent"]));
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
exports.mfaRouter.get("/audit-logs", async (req, res, next) => {
    try {
        const userId = getStr(req.query.userId || req.headers["x-user-id"]);
        const limit = parseInt(getStr(req.query.limit), 10) || 50;
        const result = await security_service_1.SecurityService.getAuditLogs(userId, limit);
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
exports.mfaRouter.post("/check-impossible-travel", async (req, res, next) => {
    try {
        const userId = getStr(req.body.userId || req.headers["x-user-id"]);
        const { newIp, lat, lon } = req.body;
        const result = await security_service_1.SecurityService.checkImpossibleTravel(userId, getStr(newIp), lat, lon, req.ip, getStr(req.headers["user-agent"]));
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
// ── Legacy MFA User Status Lookups ───────────────────────────────────────────
exports.mfaRouter.get("/users/:id/mfa", async (req, res) => {
    try {
        const id = String(req.params.id);
        const user = await database_1.prisma.user.findUnique({
            where: { id },
            select: { id: true, email: true, twoFactorEnabled: true },
        });
        if (!user)
            return res.status(404).json({ error: "User not found" });
        res.json({ success: true, mfaEnabled: !!user.twoFactorEnabled });
    }
    catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.mfaRouter.patch("/users/:id/mfa", async (req, res) => {
    try {
        const id = String(req.params.id);
        const { enabled } = req.body;
        const user = await database_1.prisma.user.update({
            where: { id },
            data: { twoFactorEnabled: !!enabled },
            select: { id: true, twoFactorEnabled: true },
        });
        res.json({ success: true, user });
    }
    catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
});
//# sourceMappingURL=mfa.routes.js.map