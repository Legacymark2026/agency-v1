import { describe, it, expect } from "vitest";
import { generateDeviceHash, canonicalizeIpSubnet } from "../../../packages/device-fingerprint/src/index";
import {
  SubscriptionAntiAbuseEngine,
  DeviceTrialRecord,
} from "./core/domain/subscription.domain";
import { SubscriptionUseCases } from "./core/usecases/subscription.usecases";

describe("Subscription Service & Device Fingerprinting Tests", () => {
  describe("Device Fingerprinting Generation", () => {
    it("generates deterministic 64-char sha256 hash for identical hardware signals", () => {
      const signals = {
        canvasHash: "canv-123",
        webglRenderer: "Apple M2 Pro",
        audioHash: "aud-456",
        screenResolution: "1920x1080",
        cpuCores: 8,
        timezone: "America/Bogota",
        platform: "MacIntel",
        language: "es",
        userAgent: "Mozilla/5.0 Chrome/120.0",
        ipSubnet: "190.145.20.15",
      };

      const hash1 = generateDeviceHash(signals, "salt-test");
      const hash2 = generateDeviceHash(signals, "salt-test");

      expect(hash1).toHaveLength(64);
      expect(hash1).toBe(hash2);
    });

    it("canonicalizes IPv4 into /24 subnet", () => {
      expect(canonicalizeIpSubnet("190.145.20.55")).toBe("190.145.20.0/24");
      expect(canonicalizeIpSubnet("190.145.20.99")).toBe("190.145.20.0/24");
    });
  });

  describe("SubscriptionAntiAbuseEngine Domain Rules", () => {
    const validDeviceHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

    it("allows trial for a clean device and new company", () => {
      const result = SubscriptionAntiAbuseEngine.evaluateTrialEligibility(
        validDeviceHash,
        "company-1",
        null,
        false
      );

      expect(result.eligible).toBe(true);
      expect(result.reason).toContain("ELIGIBLE");
    });

    it("BLOCKS trial if target company already consumed free trial", () => {
      const result = SubscriptionAntiAbuseEngine.evaluateTrialEligibility(
        validDeviceHash,
        "company-1",
        null,
        true // already had trial
      );

      expect(result.eligible).toBe(false);
      expect(result.reason).toContain("COMPANY_TRIAL_ALREADY_USED");
    });

    it("BLOCKS trial if hardware device was already used on a different company (multi-account abuse)", () => {
      const existingRecord: DeviceTrialRecord = {
        deviceHash: validDeviceHash,
        companyId: "company-original-abuser",
        claimedAt: new Date(),
        trialEndsAt: new Date(Date.now() + 10 * 86400000),
        isFlaggedAbuser: false,
      };

      const result = SubscriptionAntiAbuseEngine.evaluateTrialEligibility(
        validDeviceHash,
        "company-new-fake-account",
        existingRecord,
        false
      );

      expect(result.eligible).toBe(false);
      expect(result.reason).toContain("DEVICE_COLLISION_DETECTED");
      expect(result.reason).toContain("company-original-abuser");
    });
  });

  describe("SubscriptionUseCases Hexagonal Flow", () => {
    it("successfully claims trial for eligible user and rejects second attempt from same device", async () => {
      let savedRecord: DeviceTrialRecord | null = null;
      let savedSub: any = null;

      const mockSubRepo: any = {
        getSubscriptionByCompanyId: async (cId: string) => (savedSub?.companyId === cId ? savedSub : null),
        upsertSubscription: async (data: any) => {
          savedSub = { ...data, id: "sub-1" };
          return savedSub;
        },
      };


      const mockDeviceRepo: any = {
        findRecordByDeviceHash: async (h: string) => savedRecord,
        saveTrialClaim: async (rec: DeviceTrialRecord) => {
          savedRecord = rec;
        },
        flagAbuser: async () => {},
      };

      const useCases = new SubscriptionUseCases(mockSubRepo, mockDeviceRepo);

      // Attempt 1: First company claims trial
      const res1 = await useCases.claimFreeTrial({
        companyId: "company-alpha",
        deviceHash: "11112222333344445555666677778888",
        durationDays: 14,
      });

      expect(res1.success).toBe(true);
      expect(res1.subscription?.status).toBe("trialing");
      expect(res1.subscription?.tier).toBe("pro");

      // Attempt 2: Attacker creates "company-beta" on SAME hardware
      const res2 = await useCases.claimFreeTrial({
        companyId: "company-beta",
        deviceHash: "11112222333344445555666677778888",
        durationDays: 14,
      });

      expect(res2.success).toBe(false);
      expect(res2.error).toContain("DEVICE_COLLISION_DETECTED");
    });
  });
});
