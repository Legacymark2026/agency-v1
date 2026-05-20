"use strict";
/**
 * Auth Service — Identity & Access Management Microservice
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles: Authentication, Authorization, RBAC, MFA, Sessions, API Keys
 * Port: 4001
 *
 * Models: User, Session, Account, Role, Permission, RoleConfig, CompanyUser
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const database_1 = require("@agency/database");
const events_1 = require("@agency/events");
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || "4001", 10);
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
// ── Middleware ────────────────────────────────────────────────────────────────
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: process.env.ALLOWED_ORIGINS?.split(",") || "*" }));
app.use(express_1.default.json({ limit: "1mb" }));
// ── Health Checks (Required for K8s) ─────────────────────────────────────────
app.get("/health", (_req, res) => {
    res.json({ status: "healthy", service: "auth-service", timestamp: new Date().toISOString() });
});
app.get("/ready", async (_req, res) => {
    try {
        await database_1.prisma.$queryRaw `SELECT 1`;
        res.json({ status: "ready", db: "connected" });
    }
    catch (err) {
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
        const user = await database_1.prisma.user.findUnique({
            where: { email },
            include: { companies: { include: { company: true, role: true } } },
        });
        if (!user || !user.passwordHash) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const bcrypt = await Promise.resolve().then(() => __importStar(require("bcryptjs")));
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        if (user.deactivatedAt) {
            return res.status(403).json({ error: "Account deactivated" });
        }
        // Generate JWT
        const jwt = await Promise.resolve().then(() => __importStar(require("jsonwebtoken")));
        const token = jwt.sign({
            sub: user.id,
            email: user.email,
            role: user.role,
            globalRole: user.globalRole,
            companies: user.companies.map((c) => ({
                companyId: c.companyId,
                roleName: c.roleName,
                companyName: c.company.name,
            })),
        }, process.env.JWT_SECRET || "dev-secret-change-me", { expiresIn: "24h" });
        // Create session
        const session = await database_1.prisma.session.create({
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
    }
    catch (err) {
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
        const jwt = await Promise.resolve().then(() => __importStar(require("jsonwebtoken")));
        const token = authHeader.slice(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev-secret-change-me");
        const user = await database_1.prisma.user.findUnique({
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
        if (!user)
            return res.status(404).json({ error: "User not found" });
        res.json({ user });
    }
    catch {
        res.status(401).json({ error: "Invalid or expired token" });
    }
});
// POST /api/auth/validate — Internal service-to-service token validation
app.post("/api/auth/validate", async (req, res) => {
    try {
        const { token } = req.body;
        const jwt = await Promise.resolve().then(() => __importStar(require("jsonwebtoken")));
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev-secret-change-me");
        res.json({ valid: true, claims: decoded });
    }
    catch {
        res.json({ valid: false });
    }
});
// GET /api/auth/roles/:companyId — Get roles for a company
app.get("/api/auth/roles/:companyId", async (req, res) => {
    try {
        const roles = await database_1.prisma.role.findMany({
            where: { companyId: req.params.companyId, isActive: true },
            include: { permissions: { include: { permission: true } } },
        });
        res.json({ roles });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
// ── Event Bus Setup ──────────────────────────────────────────────────────────
const eventBus = new events_1.EventBus(REDIS_URL, "auth-service");
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
    await database_1.prisma.$disconnect();
    process.exit(0);
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
exports.default = app;
//# sourceMappingURL=index.js.map