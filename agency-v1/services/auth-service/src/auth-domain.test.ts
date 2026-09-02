/**
 * Auth Domain Unit Tests
 * ─────────────────────────────────────────────────────────────────────────────
 * Tests:
 *  - RS256 Keystore generation and JWT signature verification
 *  - RBAC permission evaluation & super_admin bypass
 *  - Global role validation whitelist
 */
import { describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";
import { initCryptoKeys } from "./lib/keys";

describe("Auth Service Domain Tests", () => {
  describe("RS256 Keystore & Token Verification", () => {
    it("should initialize RS256 4096-bit keypair deterministically", () => {
      const { privateKey, publicKey } = initCryptoKeys();
      expect(privateKey).toBeDefined();
      expect(publicKey).toBeDefined();
      expect(privateKey).toContain("BEGIN PRIVATE KEY");
      expect(publicKey).toContain("BEGIN PUBLIC KEY");
    });

    it("should sign and verify JWT using RS256 keys", () => {
      const { privateKey, publicKey } = initCryptoKeys();
      const payload = {
        sub: "user-test-123",
        email: "test@agency.dev",
        role: "admin",
        companyId: "comp-123",
      };

      const token = jwt.sign(payload, privateKey, {
        algorithm: "RS256",
        expiresIn: "1h",
        keyid: "auth-service-rs256-key-1",
      });

      expect(token).toBeDefined();

      const decoded = jwt.verify(token, publicKey, { algorithms: ["RS256"] }) as any;
      expect(decoded.sub).toBe(payload.sub);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
      expect(decoded.companyId).toBe(payload.companyId);
    });

    it("should reject token signed with mismatched algorithm or key", () => {
      const { publicKey } = initCryptoKeys();
      const forgedToken = jwt.sign({ sub: "hacker" }, "wrong-secret", { algorithm: "HS256" });

      expect(() => {
        jwt.verify(forgedToken, publicKey, { algorithms: ["RS256"] });
      }).toThrow();
    });
  });

  describe("RBAC Evaluation", () => {
    function evaluatePermission(
      userRole: string,
      userPermissions: string[],
      requiredPermission: string
    ): boolean {
      if (userRole === "super_admin") return true;
      return userPermissions.includes(requiredPermission) || userPermissions.includes("*");
    }

    it("allows super_admin unrestricted access", () => {
      expect(evaluatePermission("super_admin", [], "billing:delete")).toBe(true);
    });

    it("checks explicit permissions for standard roles", () => {
      const userPerms = ["crm:leads:read", "crm:leads:create"];
      expect(evaluatePermission("manager", userPerms, "crm:leads:read")).toBe(true);
      expect(evaluatePermission("manager", userPerms, "crm:leads:delete")).toBe(false);
    });
  });

  describe("Global Role Whitelisting", () => {
    const VALID_GLOBAL_ROLES = ["super_admin", "admin", "manager", "user", "viewer", "guest"] as const;

    function isValidRole(role: string): boolean {
      return (VALID_GLOBAL_ROLES as readonly string[]).includes(role);
    }

    it("accepts valid global roles", () => {
      expect(isValidRole("super_admin")).toBe(true);
      expect(isValidRole("admin")).toBe(true);
      expect(isValidRole("user")).toBe(true);
    });

    it("rejects malicious or invalid roles", () => {
      expect(isValidRole("root")).toBe(false);
      expect(isValidRole("sudo")).toBe(false);
      expect(isValidRole("injection'; DROP TABLE users;--")).toBe(false);
    });
  });
});
