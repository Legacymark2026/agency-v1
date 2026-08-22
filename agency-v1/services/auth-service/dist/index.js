"use strict";
/**
 * Auth Service — Identity & Access Management Microservice
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles: Authentication, Authorization, RBAC, MFA, Sessions, API Keys
 * Port: 4001
 *
 * DB routing (via @agency/database proxy):
 *   - User, Session, Account, Role, Permission, RoleConfig, ApiKey → AUTH DB
 *   - CompanyUser → CORE DB (soft-linked by userId)
 *   - UserActivityLog → ANALYTICS DB
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
try {
    require("@agency/observability/register");
}
catch { /* optional */ }
const service_auth_1 = require("@agency/service-auth");
const observability_1 = require("@agency/observability");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const database_1 = require("@agency/database");
const events_1 = require("@agency/events");
const ioredis_1 = __importDefault(require("ioredis"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
app.use((0, observability_1.metricsMiddleware)("auth-service"));
const PORT = parseInt(process.env.PORT || "4001", 10);
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const redis = new ioredis_1.default(REDIS_URL);
const crypto_1 = __importDefault(require("crypto"));
redis.on("error", (err) => console.error("[auth-service] Redis error:", err.message));
// Load or Auto-Generate RS256 Keys for JWT Signing & JWKS Verification
let privateKey = null;
let publicKey = null;
try {
    if (fs_1.default.existsSync("/certs/private.key")) {
        privateKey = fs_1.default.readFileSync("/certs/private.key", "utf8");
        publicKey = fs_1.default.readFileSync("/certs/public.key", "utf8");
        console.log("[auth-service] RS256 keys loaded from /certs");
    }
    else {
        const localPrivate = path_1.default.join(__dirname, "../../../certs/private.key");
        const localPublic = path_1.default.join(__dirname, "../../../certs/public.key");
        if (fs_1.default.existsSync(localPrivate)) {
            privateKey = fs_1.default.readFileSync(localPrivate, "utf8");
            publicKey = fs_1.default.readFileSync(localPublic, "utf8");
            console.log("[auth-service] RS256 keys loaded from local certs");
        }
    }
}
catch (err) {
    console.warn("[auth-service] Key load warning:", err.message);
}
// ── HashiCorp Vault Secrets Ingestion ───────────────────────────────────────
const vault_1 = require("@services/vault");
async function loadSecretsFromVault() {
    try {
        const secrets = await vault_1.VaultService.getSecret("secret/data/auth");
        if (secrets) {
            if (secrets.privateKey)
                privateKey = secrets.privateKey;
            if (secrets.publicKey)
                publicKey = secrets.publicKey;
            if (secrets.jwtSecret)
                process.env.JWT_SECRET = secrets.jwtSecret;
        }
    }
    catch (err) {
        console.error("[auth-service] Vault secret load failed:", err.message);
    }
}
// Load dynamically before fallback keys generation
loadSecretsFromVault().then(() => {
    if (!privateKey || !publicKey) {
        console.warn("[auth-service] ⚠️  No RSA keys found — auto-generating 4096-bit keypair. Mount persistent keys in /certs/ for production!");
        const { privateKey: genPrivate, publicKey: genPublic } = crypto_1.default.generateKeyPairSync("rsa", {
            modulusLength: 4096,
            publicKeyEncoding: { type: "spki", format: "pem" },
            privateKeyEncoding: { type: "pkcs8", format: "pem" },
        });
        privateKey = genPrivate;
        publicKey = genPublic;
    }
});
// ── Middleware ────────────────────────────────────────────────────────────────
app.use((0, helmet_1.default)());
// H-4 FIX: Never allow wildcard CORS — require explicit ALLOWED_ORIGINS
app.use((0, cors_1.default)({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"],
    credentials: true,
}));
app.use(express_1.default.json({ limit: "1mb" }));
// ── JWKS Endpoint (JSON Web Key Set - Inter-service Public Key Verification) ──
app.get("/.well-known/jwks.json", (_req, res) => {
    try {
        if (!publicKey)
            return res.status(500).json({ error: "Public key unavailable" });
        const pubKeyObj = crypto_1.default.createPublicKey(publicKey);
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
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ── Helper: write activity log (fire-and-forget, never throws) ────────────────
async function logActivity(userId, action, details, req) {
    try {
        await database_1.prisma.userActivityLog.create({
            data: {
                userId,
                action,
                details,
                ipAddress: req.ip ?? null,
                userAgent: req.headers["user-agent"] ?? null,
            },
        });
    }
    catch {
        // Non-critical — never block the request on a logging failure
    }
}
// ── Health Checks (Required for K8s) ─────────────────────────────────────────
app.get("/health", (_req, res) => {
    res.json({ status: "healthy", service: "auth-service", timestamp: new Date().toISOString() });
});
app.get("/metrics", observability_1.metricsEndpoint);
app.get("/ready", async (_req, res) => {
    try {
        await database_1.prisma.$queryRaw `SELECT 1`;
        res.json({ status: "ready", db: "connected" });
    }
    catch (err) {
        res.status(503).json({ status: "not_ready", db: "disconnected", error: String(err) });
    }
});
const auth_routes_1 = require("./routes/auth.routes");
const auth_middleware_1 = require("./middlewares/auth.middleware");
app.use("/api/v1/auth", (0, auth_routes_1.createAuthRouter)(privateKey));
app.use(auth_middleware_1.errorHandler);
// ── Auth Routes (Legacy Endpoints Backup) ───────────────────────────────────
// POST /api/auth/login
app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password required" });
        }
        // Rate Limiting (ISO 27001 A.12.1 — Brute Force Protection)
        const clientIp = req.ip || req.headers["x-forwarded-for"] || "unknown";
        const rateLimitKey = `ratelimit:login:${clientIp}:${email.toLowerCase().trim()}`;
        const attempts = await redis.incr(rateLimitKey);
        if (attempts === 1) {
            await redis.expire(rateLimitKey, 300); // 5 minute window
        }
        if (attempts > 5) {
            await logActivity(null, "login_blocked_rate_limit", { email, ip: clientIp, attempts }, req);
            return res.status(429).json({
                error: "Too many failed login attempts. Account temporarily locked for 5 minutes for security."
            });
        }
        // Step 1: Fetch user from AUTH DB (no cross-DB include)
        const user = await database_1.prisma.user.findUnique({
            where: { email },
        });
        if (!user || !user.passwordHash) {
            await logActivity(null, "login_failed", { email, reason: "user_not_found" }, req);
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const bcrypt = await Promise.resolve().then(() => __importStar(require("bcryptjs")));
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            await logActivity(user.id, "login_failed", { email, reason: "invalid_password" }, req);
            return res.status(401).json({ error: "Invalid credentials" });
        }
        if (user.deactivatedAt) {
            await logActivity(user.id, "login_failed", { email, reason: "account_deactivated" }, req);
            return res.status(403).json({ error: "Account deactivated" });
        }
        // Step 2: Fetch company memberships from CORE DB (separate query via proxy)
        let companyMemberships = [];
        try {
            const rawMemberships = await database_1.prisma.companyUser.findMany({
                where: { userId: user.id },
                include: { company: { select: { id: true, name: true } } },
            });
            companyMemberships = rawMemberships ?? [];
        }
        catch (err) {
            // Non-fatal — user can log in without company data
            console.warn("[auth-service] Could not fetch company memberships for user:", user.id, err);
        }
        // DPoP Validation (RFC 9449)
        const dpopHeader = req.headers.dpop;
        let dpopConfirmation = undefined;
        if (dpopHeader) {
            const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
            const verification = await (0, dpop_1.verifyDPoPProof)(dpopHeader, req.method, fullUrl);
            if (!verification.success) {
                return res.status(400).json({ error: `DPoP proof verification failed: ${verification.error}` });
            }
            dpopConfirmation = { jkt: verification.thumbprint };
        }
        // Generate JWT
        const jwt = await Promise.resolve().then(() => __importStar(require("jsonwebtoken")));
        // H-1 FIX: No hardcoded fallback secrets — fail loudly if misconfigured
        const signKey = privateKey || process.env.JWT_SECRET;
        if (!signKey) {
            console.error("[auth-service] FATAL: No JWT signing key configured");
            return res.status(500).json({ error: "Authentication service misconfigured" });
        }
        // H-7 FIX: Align JWT TTL with NextAuth session (1 hour)
        const signOptions = { expiresIn: "1h" };
        if (privateKey) {
            signOptions.algorithm = "RS256";
        }
        const token = jwt.sign({
            sub: user.id,
            email: user.email,
            role: user.role,
            globalRole: user.globalRole,
            companies: companyMemberships.map((c) => ({
                companyId: c.companyId,
                roleName: c.roleName,
                companyName: c.company?.name ?? "",
            })),
            ...(dpopConfirmation && { cnf: dpopConfirmation }),
        }, signKey, signOptions);
        // H-3 FIX: Store SHA-256 hash of token, never the raw JWT
        const tokenHash = crypto_1.default.createHash("sha256").update(token).digest("hex");
        const session = await database_1.prisma.session.create({
            data: {
                userId: user.id,
                sessionToken: tokenHash,
                expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour aligned with JWT TTL
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"],
            },
        });
        // Reset rate limit attempts counter on successful login
        await redis.del(rateLimitKey);
        // Log successful login to ANALYTICS DB (fire-and-forget)
        await logActivity(user.id, "login_success", { sessionId: session.id, email: user.email }, req);
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
        const token = authHeader.slice(7);
        // Check Redis blacklist
        const isBlacklisted = await redis.get(`jwt:blacklist:${token}`);
        if (isBlacklisted) {
            return res.status(401).json({ error: "Token has been revoked" });
        }
        const jwt = await Promise.resolve().then(() => __importStar(require("jsonwebtoken")));
        // H-1 FIX: No hardcoded fallback
        const verifyKey = publicKey || process.env.JWT_SECRET;
        if (!verifyKey)
            return res.status(500).json({ error: "Auth service misconfigured" });
        const verifyOptions = {};
        if (publicKey) {
            verifyOptions.algorithms = ["RS256"];
        }
        const decoded = jwt.verify(token, verifyKey, verifyOptions);
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
// POST /api/auth/logout — Revoke token immediately by blacklisting it in Redis
app.post("/api/auth/logout", async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
            return res.status(400).json({ error: "No token provided" });
        }
        const token = authHeader.slice(7);
        const jwt = await Promise.resolve().then(() => __importStar(require("jsonwebtoken")));
        const verifyKey = publicKey || process.env.JWT_SECRET;
        if (!verifyKey)
            return res.status(500).json({ error: "Auth service misconfigured" });
        const verifyOptions = {};
        if (publicKey) {
            verifyOptions.algorithms = ["RS256"];
        }
        // Verify first to get expiration and ensure it's a valid token structure
        const decoded = jwt.verify(token, verifyKey, verifyOptions);
        // Calculate remaining TTL in seconds
        let ttl = 24 * 60 * 60;
        if (decoded.exp) {
            const now = Math.floor(Date.now() / 1000);
            ttl = Math.max(1, decoded.exp - now);
        }
        // Add to Redis blacklist
        await redis.setex(`jwt:blacklist:${token}`, ttl, "revoked");
        // Clean up SQL session table (H-3: match by hashed token)
        const logoutTokenHash = crypto_1.default.createHash("sha256").update(token).digest("hex");
        await database_1.prisma.session.deleteMany({
            where: { sessionToken: logoutTokenHash },
        });
        // Log logout to ANALYTICS DB (fire-and-forget)
        if (decoded.sub) {
            await logActivity(decoded.sub, "logout", {}, req);
        }
        res.json({ success: true, message: "Logged out and token blacklisted successfully" });
    }
    catch (err) {
        // Even if verification fails (e.g. token expired), we delete database sessions matching it
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith("Bearer ")) {
            const token = authHeader.slice(7);
            await database_1.prisma.session.deleteMany({ where: { sessionToken: token } }).catch(() => { });
        }
        res.status(401).json({ error: "Invalid token or already expired" });
    }
});
// POST /api/auth/validate — Internal service-to-service token validation
app.post("/api/auth/validate", async (req, res) => {
    // Verify internal service secret
    const authHeader = req.headers.authorization;
    // H-1 FIX: No hardcoded fallback for inter-service secret
    const internalSecret = process.env.INTERNAL_SECRET;
    if (!internalSecret)
        return res.status(500).json({ error: "Internal secret not configured" });
    if (!authHeader || authHeader !== `Bearer ${internalSecret}`) {
        return res.status(401).json({ error: "Unauthorized inter-service request" });
    }
    try {
        const { token } = req.body;
        // Check Redis blacklist
        const isBlacklisted = await redis.get(`jwt:blacklist:${token}`);
        if (isBlacklisted) {
            return res.json({ valid: false, reason: "revoked" });
        }
        const jwt = await Promise.resolve().then(() => __importStar(require("jsonwebtoken")));
        const verifyKey = publicKey || process.env.JWT_SECRET;
        if (!verifyKey)
            return res.json({ valid: false, reason: "misconfigured" });
        const verifyOptions = {};
        if (publicKey) {
            verifyOptions.algorithms = ["RS256"];
        }
        const decoded = jwt.verify(token, verifyKey, verifyOptions);
        res.json({ valid: true, claims: decoded });
    }
    catch {
        res.json({ valid: false });
    }
});
// POST /api/auth/check-permission — ACL Granular Permission Evaluator (RBAC + ACL Overrides)
app.post("/api/auth/check-permission", async (req, res) => {
    try {
        const { userId, permissionCode } = req.body;
        if (!userId || !permissionCode) {
            return res.status(400).json({ allowed: false, error: "userId and permissionCode are required" });
        }
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, role: true, globalRole: true },
        });
        if (!user) {
            return res.json({ allowed: false, reason: "User not found" });
        }
        // SuperAdmin bypasses all permission checks
        if (user.role === "super_admin" || user.globalRole === "super_admin") {
            return res.json({ allowed: true, grantedBy: "SUPER_ADMIN" });
        }
        // Check Role Permissions
        const roleConfig = await database_1.prisma.roleConfig.findUnique({
            where: { roleName: user.role || "guest" },
        });
        const allowedRoutes = roleConfig?.allowedRoutes || [];
        const isAllowed = allowedRoutes.some((pattern) => pattern === permissionCode || pattern === "/api/*" || permissionCode.startsWith(pattern.replace("*", "")));
        res.json({
            allowed: isAllowed,
            grantedBy: isAllowed ? "ROLE_PERMISSIONS" : "NONE",
            permissionCode,
            role: user.role,
        });
    }
    catch (err) {
        res.status(500).json({ allowed: false, error: err.message });
    }
});
// ── C-4 FIX: Authentication middleware for all RBAC/admin routes ──────────
// Extracts and verifies JWT from Authorization header before allowing access
const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Authentication required" });
        }
        const token = authHeader.slice(7);
        const isBlacklisted = await redis.get(`jwt:blacklist:${token}`);
        if (isBlacklisted)
            return res.status(401).json({ error: "Token revoked" });
        const jwt = await Promise.resolve().then(() => __importStar(require("jsonwebtoken")));
        const verifyKey = publicKey || process.env.JWT_SECRET;
        if (!verifyKey)
            return res.status(500).json({ error: "Auth misconfigured" });
        const verifyOptions = publicKey ? { algorithms: ["RS256"] } : {};
        const decoded = jwt.verify(token, verifyKey, verifyOptions);
        req.authUser = { id: decoded.sub, role: decoded.role, email: decoded.email };
        next();
    }
    catch {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
};
// Require super_admin role for sensitive operations
const requireAdmin = async (req, res, next) => {
    const user = req.authUser;
    if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
        return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
};
// GET /api/auth/roles/:companyId — Get roles for a company
app.get("/api/auth/roles/:companyId", requireAuth, async (req, res) => {
    try {
        const roles = await database_1.prisma.role.findMany({
            where: { companyId: req.params.companyId, isActive: true },
            include: { permissions: { include: { permission: true } } },
        });
        res.json({ roles });
    }
    catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
});
// Custom Roles CRUD
app.get('/api/auth/roles/full/:companyId', requireAuth, async (req, res) => {
    try {
        const roles = await database_1.prisma.role.findMany({
            where: { companyId: req.params.companyId, isActive: true },
            include: {
                permissions: {
                    include: {
                        permission: { select: { id: true, name: true, module: true, description: true } }
                    }
                },
                _count: { select: { permissions: true } }
            },
            orderBy: [{ priority: 'desc' }, { name: 'asc' }]
        });
        res.json(roles);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.get('/api/auth/roles/:id/detail', requireAuth, async (req, res) => {
    try {
        const role = await database_1.prisma.role.findFirst({
            where: { id: req.params.id },
            include: {
                permissions: {
                    include: {
                        permission: { select: { id: true, name: true, module: true, description: true } }
                    }
                },
                _count: { select: { users: true } }
            }
        });
        res.json(role);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.post('/api/auth/roles', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { companyId, name, description, isDefault, priority, permissionIds } = req.body;
        const existing = await database_1.prisma.role.findFirst({ where: { companyId, name } });
        if (existing)
            return res.status(400).json({ error: 'Ya existe un rol con este nombre' });
        if (isDefault) {
            await database_1.prisma.role.updateMany({ where: { companyId, isDefault: true }, data: { isDefault: false } });
        }
        const role = await database_1.prisma.role.create({
            data: {
                companyId,
                name,
                description,
                isDefault: isDefault ?? false,
                priority: priority ?? 0,
                permissions: {
                    create: (permissionIds || []).map((pId) => ({ permissionId: pId }))
                }
            },
            include: { permissions: { include: { permission: true } } }
        });
        res.status(201).json(role);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.patch('/api/auth/roles/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { companyId, name, description, isDefault, isActive, priority, permissionIds } = req.body;
        const existing = await database_1.prisma.role.findFirst({ where: { id: req.params.id } });
        if (!existing)
            return res.status(404).json({ error: 'Rol no encontrado' });
        if (isDefault && !existing.isDefault) {
            await database_1.prisma.role.updateMany({ where: { companyId: existing.companyId, isDefault: true }, data: { isDefault: false } });
        }
        const role = await database_1.prisma.role.update({
            where: { id: req.params.id },
            data: {
                ...(name !== undefined && { name }),
                ...(description !== undefined && { description }),
                ...(isDefault !== undefined && { isDefault }),
                ...(isActive !== undefined && { isActive }),
                ...(priority !== undefined && { priority })
            },
            include: { permissions: { include: { permission: true } } }
        });
        if (permissionIds !== undefined) {
            await database_1.prisma.rolePermission.deleteMany({ where: { roleId: req.params.id } });
            if (permissionIds.length > 0) {
                await database_1.prisma.rolePermission.createMany({
                    data: permissionIds.map((pId) => ({ roleId: req.params.id, permissionId: pId }))
                });
            }
        }
        res.json(role);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.delete('/api/auth/roles/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const role = await database_1.prisma.role.findUnique({ where: { id: req.params.id } });
        if (!role)
            return res.status(404).json({ error: 'Rol no encontrado' });
        // Check if any companyUser has this roleName in CORE DB
        const usersWithRole = await database_1.prisma.companyUser.count({
            where: { companyId: role.companyId, roleName: role.name }
        });
        if (usersWithRole > 0)
            return res.status(400).json({ error: 'El rol tiene usuarios asignados' });
        await database_1.prisma.rolePermission.deleteMany({ where: { roleId: req.params.id } });
        await database_1.prisma.role.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// User Assignment & RBAC Stats
app.patch('/api/auth/assign-role', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { userId, companyId, roleId } = req.body;
        // companyUser lives in CORE DB — accessed via proxy
        const target = await database_1.prisma.companyUser.findFirst({ where: { userId, companyId } });
        if (!target)
            return res.status(400).json({ error: 'El usuario no pertenece a esta empresa' });
        // Update roleName by looking up the role name from AUTH DB
        const role = await database_1.prisma.role.findUnique({ where: { id: roleId }, select: { name: true } });
        if (!role)
            return res.status(404).json({ error: 'Rol no encontrado' });
        await database_1.prisma.companyUser.update({
            where: { id: target.id },
            data: { roleName: role.name }
        });
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.get('/api/auth/users-with-roles/:companyId', requireAuth, async (req, res) => {
    try {
        // Step 1: Get company members from CORE DB
        const members = await database_1.prisma.companyUser.findMany({
            where: { companyId: req.params.companyId },
            include: {
                team: { select: { id: true, name: true } }
            },
            orderBy: [{ joinedAt: 'desc' }]
        });
        if (!members || members.length === 0) {
            return res.json([]);
        }
        // Step 2: Fetch user details from AUTH DB (batch)
        const userIds = members.map((m) => m.userId);
        const users = await database_1.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, email: true, image: true }
        });
        const userMap = new Map(users.map((u) => [u.id, u]));
        // Step 3: Combine results
        const result = members.map((m) => ({
            id: m.id,
            userId: m.userId,
            companyId: m.companyId,
            roleName: m.roleName,
            joinedAt: m.joinedAt,
            team: m.team,
            user: userMap.get(m.userId) ?? null,
        }));
        res.json(result);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.get('/api/auth/permissions', requireAuth, async (req, res) => {
    try {
        const permissions = await database_1.prisma.permission.findMany({
            where: { isActive: true },
            orderBy: [{ module: 'asc' }, { name: 'asc' }]
        });
        res.json(permissions);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.post('/api/auth/permissions/sync', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { permissions } = req.body;
        const existing = await database_1.prisma.permission.findMany({ select: { name: true } });
        const existingNames = new Set(existing.map(p => p.name));
        let created = 0;
        for (const perm of permissions) {
            if (existingNames.has(perm.name))
                continue;
            await database_1.prisma.permission.create({
                data: { name: perm.name, module: perm.module, description: perm.description, isActive: true }
            });
            created++;
        }
        res.json({ success: true, created });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// MFA Endpoints
// C-2 FIX: Never expose mfaSecret or backupCodes in GET response
app.get('/api/auth/users/:id/mfa', requireAuth, async (req, res) => {
    try {
        // Ensure user can only query their own MFA status
        const authUser = req.authUser;
        if (authUser.id !== req.params.id && authUser.role !== 'super_admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const user = await database_1.prisma.user.findUnique({
            where: { id: req.params.id },
            select: { email: true, mfaEnabled: true, backupCodes: true }
        });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        // Only return whether MFA is enabled and how many backup codes remain
        const backupCodes = user.backupCodes || [];
        const unusedCount = backupCodes.filter((c) => c !== 'USED').length;
        res.json({
            email: user.email,
            mfaEnabled: user.mfaEnabled,
            backupCodesRemaining: unusedCount,
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
// C-3 FIX: Whitelist allowed MFA fields — prevent mass assignment / privilege escalation
app.patch('/api/auth/users/:id/mfa', requireAuth, async (req, res) => {
    try {
        const authUser = req.authUser;
        if (authUser.id !== req.params.id && authUser.role !== 'super_admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        // Only allow MFA-related fields — NEVER pass req.body directly
        const { mfaEnabled, mfaSecret, backupCodes } = req.body;
        await database_1.prisma.user.update({
            where: { id: req.params.id },
            data: {
                ...(mfaEnabled !== undefined && { mfaEnabled: Boolean(mfaEnabled) }),
                ...(mfaSecret !== undefined && { mfaSecret: String(mfaSecret) }),
                ...(backupCodes !== undefined && { backupCodes }),
            },
        });
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
// RoleConfig & Global Users Endpoints
app.post('/api/auth/role-configs', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { roleName, allowedRoutes, description, isActive } = req.body;
        const name = String(roleName || '').trim().toLowerCase();
        const config = await database_1.prisma.roleConfig.upsert({
            where: { roleName: name },
            create: {
                roleName: name,
                allowedRoutes,
                description: description ?? null,
                isActive: isActive ?? true,
            },
            update: {
                allowedRoutes,
                description: description ?? null,
                isActive: isActive ?? true,
            },
        });
        res.json(config);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.delete('/api/auth/role-configs/:roleName', requireAuth, requireAdmin, async (req, res) => {
    try {
        const rawRoleName = req.params.roleName;
        const name = String(Array.isArray(rawRoleName) ? rawRoleName[0] : rawRoleName || '').trim().toLowerCase();
        await database_1.prisma.roleConfig.delete({ where: { roleName: name } });
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.get('/api/auth/role-configs', requireAuth, async (req, res) => {
    try {
        const configs = await database_1.prisma.roleConfig.findMany({ orderBy: { roleName: 'asc' } });
        res.json(configs);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.get('/api/auth/global-users', requireAuth, requireAdmin, async (req, res) => {
    try {
        const users = await database_1.prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                deactivatedAt: true,
            },
            orderBy: { role: 'asc' },
        });
        res.json(users);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.patch('/api/auth/global-users/:id/role', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { role } = req.body;
        const name = String(role || '').trim().toLowerCase();
        const targetId = String(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
        const user = await database_1.prisma.user.update({
            where: { id: targetId },
            data: { role: name },
        });
        res.json({ success: true, user });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ── Event Bus Setup ──────────────────────────────────────────────────────────
const eventBus = new events_1.EventBus(REDIS_URL, "auth-service");
// ── High-Speed Synchronous gRPC Server Setup ──────────────────────────────────
const grpc_1 = require("@agency/grpc");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const blacklist_1 = require("@utilities/blacklist");
const dpop_1 = require("@utilities/dpop");
const GRPC_PORT = parseInt(process.env.GRPC_PORT || "50051", 10);
const grpcServer = new grpc_1.GrpcServerHelper();
grpcServer.addService(grpc_1.PROTO_PATHS.auth, "auth", "AuthService", {
    ValidateToken: async (call, callback) => {
        try {
            const { token, dpopProof, httpMethod, httpUrl } = call.request;
            if (!token) {
                return callback(null, { valid: false, error: "Token is required" });
            }
            // Check Redis blacklist using sha256 helper
            const isRevoked = await (0, blacklist_1.isTokenRevoked)(token);
            if (isRevoked) {
                return callback(null, { valid: false, error: "Token has been revoked" });
            }
            const verifyKey = publicKey || process.env.JWT_SECRET;
            if (!verifyKey)
                return callback(null, { valid: false, error: "Auth misconfigured" });
            const verifyOptions = {};
            if (publicKey)
                verifyOptions.algorithms = ["RS256"];
            const decoded = jsonwebtoken_1.default.verify(token, verifyKey, verifyOptions);
            // ── DPoP Confirmation Claim Verification (RFC 9449) ───────────────────
            if (decoded.cnf?.jkt) {
                if (!dpopProof) {
                    return callback(null, { valid: false, error: "DPoP proof required for this token" });
                }
                const verification = await (0, dpop_1.verifyDPoPProof)(dpopProof, httpMethod || "GET", httpUrl || "");
                if (!verification.success || verification.thumbprint !== decoded.cnf.jkt) {
                    return callback(null, { valid: false, error: verification.error || "DPoP proof signature mismatch" });
                }
            }
            const { userRepository } = await Promise.resolve().then(() => __importStar(require("@repositories/user.repository")));
            const user = await userRepository.findById(decoded.sub);
            if (!user) {
                return callback(null, { valid: false, error: "User not found" });
            }
            callback(null, {
                valid: true,
                userId: user.id,
                email: user.email,
                role: user.role || "user",
                companyId: decoded.companyId || "",
                error: ""
            });
        }
        catch (err) {
            callback(null, { valid: false, error: err.message || "Invalid token" });
        }
    },
    GetUserPermissions: async (call, callback) => {
        try {
            const { userId } = call.request;
            const user = await database_1.prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, role: true }
            });
            if (!user) {
                return callback(null, { userId, permissions: [], role: "" });
            }
            const roleConfig = await database_1.prisma.roleConfig.findUnique({
                where: { roleName: user.role || "user" }
            });
            const permissions = roleConfig?.allowedRoutes || ["/api/*"];
            callback(null, {
                userId: user.id,
                permissions,
                role: user.role || "user"
            });
        }
        catch (err) {
            callback(null, { userId: call.request.userId, permissions: [], role: "" });
        }
    }
});
grpcServer.start(GRPC_PORT).catch((err) => {
    console.error("[auth-service] Failed to start gRPC server:", err.message);
});
// ── Start Server ─────────────────────────────────────────────────────────────
const reconciliation_service_1 = require("@services/reconciliation.service");
const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`🔐 Auth Service running on port ${PORT} (HTTP) and port ${GRPC_PORT} (gRPC Sync)`);
    console.log(`   Health: http://localhost:${PORT}/health`);
    console.log(`   Ready:  http://localhost:${PORT}/ready`);
    // Run DB reconciliation on startup after a 10s delay, and schedule it daily
    setTimeout(() => {
        reconciliation_service_1.ReconciliationService.runUserReconciliation()
            .then((stats) => console.log(`[Reconciliation] Startup run complete:`, stats))
            .catch((err) => console.error(`[Reconciliation] Startup run failed:`, err));
    }, 10000);
    setInterval(() => {
        reconciliation_service_1.ReconciliationService.runUserReconciliation()
            .then((stats) => console.log(`[Reconciliation] Scheduled run complete:`, stats))
            .catch((err) => console.error(`[Reconciliation] Scheduled run failed:`, err));
    }, 24 * 60 * 60 * 1000);
});
(0, service_auth_1.setupGracefulShutdown)(server);
// Graceful shutdown
process.on("SIGTERM", async () => {
    console.log("[auth-service] SIGTERM received. Shutting down...");
    await grpcServer.forceShutdown();
    await eventBus.disconnect();
    await database_1.prisma.$disconnect();
    process.exit(0);
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
exports.default = app;
//# sourceMappingURL=index.js.map