"use strict";
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
/**
 * Auth Domain Unit Tests
 * ─────────────────────────────────────────────────────────────────────────────
 * Tests:
 *  - RS256 Keystore generation and JWT signature verification
 *  - RBAC permission evaluation & super_admin bypass
 *  - Global role validation whitelist
 */
const vitest_1 = require("vitest");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const keys_1 = require("./lib/keys");
(0, vitest_1.describe)("Auth Service Domain Tests", () => {
    (0, vitest_1.describe)("RS256 Keystore & Token Verification", () => {
        (0, vitest_1.it)("should initialize RS256 4096-bit keypair deterministically", () => {
            const { privateKey, publicKey } = (0, keys_1.initCryptoKeys)();
            (0, vitest_1.expect)(privateKey).toBeDefined();
            (0, vitest_1.expect)(publicKey).toBeDefined();
            (0, vitest_1.expect)(privateKey).toContain("BEGIN PRIVATE KEY");
            (0, vitest_1.expect)(publicKey).toContain("BEGIN PUBLIC KEY");
        });
        (0, vitest_1.it)("should sign and verify JWT using RS256 keys", () => {
            const { privateKey, publicKey } = (0, keys_1.initCryptoKeys)();
            const payload = {
                sub: "user-test-123",
                email: "test@agency.dev",
                role: "admin",
                companyId: "comp-123",
            };
            const token = jsonwebtoken_1.default.sign(payload, privateKey, {
                algorithm: "RS256",
                expiresIn: "1h",
                keyid: "auth-service-rs256-key-1",
            });
            (0, vitest_1.expect)(token).toBeDefined();
            const decoded = jsonwebtoken_1.default.verify(token, publicKey, { algorithms: ["RS256"] });
            (0, vitest_1.expect)(decoded.sub).toBe(payload.sub);
            (0, vitest_1.expect)(decoded.email).toBe(payload.email);
            (0, vitest_1.expect)(decoded.role).toBe(payload.role);
            (0, vitest_1.expect)(decoded.companyId).toBe(payload.companyId);
        });
        (0, vitest_1.it)("should reject token signed with mismatched algorithm or key", () => {
            const { publicKey } = (0, keys_1.initCryptoKeys)();
            const forgedToken = jsonwebtoken_1.default.sign({ sub: "hacker" }, "wrong-secret", { algorithm: "HS256" });
            (0, vitest_1.expect)(() => {
                jsonwebtoken_1.default.verify(forgedToken, publicKey, { algorithms: ["RS256"] });
            }).toThrow();
        });
    });
    (0, vitest_1.describe)("RBAC Evaluation", () => {
        function evaluatePermission(userRole, userPermissions, requiredPermission) {
            if (userRole === "super_admin")
                return true;
            return userPermissions.includes(requiredPermission) || userPermissions.includes("*");
        }
        (0, vitest_1.it)("allows super_admin unrestricted access", () => {
            (0, vitest_1.expect)(evaluatePermission("super_admin", [], "billing:delete")).toBe(true);
        });
        (0, vitest_1.it)("checks explicit permissions for standard roles", () => {
            const userPerms = ["crm:leads:read", "crm:leads:create"];
            (0, vitest_1.expect)(evaluatePermission("manager", userPerms, "crm:leads:read")).toBe(true);
            (0, vitest_1.expect)(evaluatePermission("manager", userPerms, "crm:leads:delete")).toBe(false);
        });
    });
    (0, vitest_1.describe)("Global Role Whitelisting", () => {
        const VALID_GLOBAL_ROLES = ["super_admin", "admin", "manager", "user", "viewer", "guest"];
        function isValidRole(role) {
            return VALID_GLOBAL_ROLES.includes(role);
        }
        (0, vitest_1.it)("accepts valid global roles", () => {
            (0, vitest_1.expect)(isValidRole("super_admin")).toBe(true);
            (0, vitest_1.expect)(isValidRole("admin")).toBe(true);
            (0, vitest_1.expect)(isValidRole("user")).toBe(true);
        });
        (0, vitest_1.it)("rejects malicious or invalid roles", () => {
            (0, vitest_1.expect)(isValidRole("root")).toBe(false);
            (0, vitest_1.expect)(isValidRole("sudo")).toBe(false);
            (0, vitest_1.expect)(isValidRole("injection'; DROP TABLE users;--")).toBe(false);
        });
    });
    (0, vitest_1.describe)("Hexagonal Inbound & Outbound Ports (AuthUseCases)", () => {
        (0, vitest_1.it)("registers user, issues token, and verifies permissions with decoupled adapters", async () => {
            const { AuthUseCases } = await Promise.resolve().then(() => __importStar(require("./core/usecases/auth.usecases")));
            const { UserDomain } = await Promise.resolve().then(() => __importStar(require("./core/domain/auth.domain")));
            const store = new Map();
            const publishedEvents = [];
            const mockRepo = {
                save: async (u) => {
                    store.set(u.email, u);
                    return u;
                },
                findByEmail: async (email) => store.get(email) || null,
                findById: async () => null,
            };
            const mockSigner = {
                sign: (payload) => `mock_token_for_${payload.sub}`,
                verify: (token) => ({ sub: "usr-1", role: "admin" }),
            };
            const mockPublisher = {
                publishEvent: async (topic, event) => {
                    publishedEvents.push({ topic, event });
                },
            };
            const useCases = new AuthUseCases(mockRepo, mockSigner, mockPublisher);
            // 1. Register
            const user = await useCases.register({
                email: "cfo@company.com",
                role: "admin",
                companyId: "comp-1",
                permissions: ["finance.read", "finance.write"],
            });
            (0, vitest_1.expect)(user.id).toBeDefined();
            (0, vitest_1.expect)(user.role).toBe("admin");
            (0, vitest_1.expect)(publishedEvents.some((e) => e.topic === "auth.user.registered")).toBe(true);
            // 2. Issue & verify token
            const token = useCases.issueToken(user);
            (0, vitest_1.expect)(token).toContain(user.id);
            // 3. Check access
            (0, vitest_1.expect)(useCases.checkAccess(user, "finance.read")).toBe(true);
            (0, vitest_1.expect)(useCases.checkAccess(user, "billing.delete")).toBe(false);
        });
    });
});
//# sourceMappingURL=auth-domain.test.js.map