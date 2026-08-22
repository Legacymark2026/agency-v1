"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthRouter = createAuthRouter;
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const security_service_1 = require("../services/security.service");
const auth_validators_1 = require("../validators/auth.validators");
function getStr(val) {
    if (!val)
        return '';
    if (Array.isArray(val))
        return String(val[0] || '');
    return String(val);
}
function createAuthRouter(privateKey) {
    const router = (0, express_1.Router)();
    router.post("/login", (0, auth_middleware_1.validateRequest)(auth_validators_1.loginSchema), (req, res, next) => {
        auth_controller_1.AuthController.login(req, res, next, privateKey);
    });
    router.post("/refresh", (req, res, next) => {
        auth_controller_1.AuthController.refresh(req, res, next);
    });
    router.post("/logout-all", (req, res, next) => {
        auth_controller_1.AuthController.logoutAll(req, res, next);
    });
    router.get("/sessions", (req, res, next) => {
        auth_controller_1.AuthController.getSessions(req, res, next);
    });
    router.get("/profile", (req, res, next) => {
        auth_controller_1.AuthController.getProfile(req, res, next);
    });
    // ── 🔒 2FA & Audit Logs Endpoints ──────────────────────────────────────────
    router.post("/2fa/generate", async (req, res, next) => {
        try {
            const { userId, email } = req.body;
            const result = await security_service_1.SecurityService.generate2FA(getStr(userId), getStr(email));
            res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    });
    router.post("/2fa/enable", (0, auth_middleware_1.validateRequest)(auth_validators_1.enable2FASchema), async (req, res, next) => {
        try {
            const { userId, secret, token } = req.body;
            const result = await security_service_1.SecurityService.enable2FA(getStr(userId), getStr(secret), getStr(token), req.ip, getStr(req.headers['user-agent']));
            res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    });
    router.post("/2fa/verify", (0, auth_middleware_1.validateRequest)(auth_validators_1.verify2FASchema), async (req, res, next) => {
        try {
            const { userId, tokenOrBackupCode } = req.body;
            const result = await security_service_1.SecurityService.verify2FA(getStr(userId), getStr(tokenOrBackupCode), req.ip, getStr(req.headers['user-agent']));
            res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    });
    router.post("/2fa/disable", (0, auth_middleware_1.validateRequest)(auth_validators_1.disable2FASchema), async (req, res, next) => {
        try {
            const { userId } = req.body;
            const result = await security_service_1.SecurityService.disable2FA(getStr(userId), req.ip, getStr(req.headers['user-agent']));
            res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    });
    router.get("/audit-logs", async (req, res, next) => {
        try {
            const userId = getStr(req.query.userId || req.headers['x-user-id']);
            const limit = parseInt(getStr(req.query.limit)) || 50;
            const result = await security_service_1.SecurityService.getAuditLogs(userId, limit);
            res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    });
    router.post("/auth/check-impossible-travel", async (req, res, next) => {
        try {
            const userId = getStr(req.body.userId || req.headers['x-user-id']);
            const { newIp, lat, lon } = req.body;
            const result = await security_service_1.SecurityService.checkImpossibleTravel(userId, getStr(newIp), lat, lon, req.ip, getStr(req.headers['user-agent']));
            res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    });
    return router;
}
//# sourceMappingURL=auth.routes.js.map