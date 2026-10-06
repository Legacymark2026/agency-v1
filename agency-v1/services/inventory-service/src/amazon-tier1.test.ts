import { describe, it, expect } from "vitest";
import {
  VolumetricFitEngine,
  CryptographicLedgerSigner,
  StorageBinProps,
} from "./core/domain/inventory.domain";

describe("Tier-1 Amazon Logistics Architecture Tests", () => {
  const sampleBin: StorageBinProps = {
    id: "bin-101",
    companyId: "default",
    warehouseId: "wh-1",
    zoneId: "zone-dry",
    binCode: "Z1-PA-R2-N3",
    aisle: "Aisle-1",
    rack: "Rack-2",
    shelfLevel: 3,
    maxWeightKg: 100,
    currentWeightKg: 20,
    maxVolumeCm3: 100000,
    currentVolumeCm3: 40000,
    velocityTier: "FAST",
    isActive: true,
  };

  describe("VolumetricFitEngine (Chaotic Storage Cube Calculation)", () => {
    it("should allow stowing when item fits within volumetric cube and weight rating", () => {
      // 10 items of 2000cm3 = 20,000cm3 (projected total: 60,000cm3 <= 85,000cm3 threshold)
      // 10 items of 2kg = 20kg (projected total: 40kg <= 100kg)
      const result = VolumetricFitEngine.evaluateBinFit(sampleBin, 20000, 20);
      expect(result.canFit).toBe(true);
      expect(result.projectedVolumeUtilPct).toBe(60);
      expect(result.projectedWeightKg).toBe(40);
    });

    it("should reject stowing when projected weight exceeds structural capacity", () => {
      const result = VolumetricFitEngine.evaluateBinFit(sampleBin, 10000, 90); // 20 + 90 = 110kg > 100kg
      expect(result.canFit).toBe(false);
      expect(result.reason).toContain("Exceso de peso estructural");
    });

    it("should reject stowing when projected volume exceeds safety cube threshold (85%)", () => {
      const result = VolumetricFitEngine.evaluateBinFit(sampleBin, 50000, 10); // 40k + 50k = 90,000cm3 > 85,000cm3
      expect(result.canFit).toBe(false);
      expect(result.reason).toContain("Exceso de volumen espacial");
    });
  });

  describe("CryptographicLedgerSigner (FDA 21 CFR Part 11 Compliance)", () => {
    it("should generate deterministic SHA-256 signature hash for an immutable ledger movement", () => {
      const timestamp = new Date("2026-10-06T12:00:00Z");
      const hash1 = CryptographicLedgerSigner.generateSignatureHash({
        previousHash: "GENESIS",
        transactionUuid: "tx-test-001",
        companyId: "default",
        warehouseId: "wh-1",
        productId: "prod-geisha",
        quantity: 50,
        movementType: "IN_PURCHASE",
        balanceAfter: 450,
        timestamp,
        operatorBadgeId: "OP-4821",
      });

      expect(typeof hash1).toBe("string");
      expect(hash1.length).toBe(64);

      // Same parameters must yield exact same hash
      const hash2 = CryptographicLedgerSigner.generateSignatureHash({
        previousHash: "GENESIS",
        transactionUuid: "tx-test-001",
        companyId: "default",
        warehouseId: "wh-1",
        productId: "prod-geisha",
        quantity: 50,
        movementType: "IN_PURCHASE",
        balanceAfter: 450,
        timestamp,
        operatorBadgeId: "OP-4821",
      });
      expect(hash1).toBe(hash2);
    });

    it("should detect tampering if movement quantity or balance is altered", () => {
      const timestamp = new Date("2026-10-06T12:00:00Z");
      const originalHash = CryptographicLedgerSigner.generateSignatureHash({
        transactionUuid: "tx-test-002",
        companyId: "default",
        warehouseId: "wh-1",
        productId: "prod-geisha",
        quantity: 50,
        movementType: "IN_PURCHASE",
        balanceAfter: 450,
        timestamp,
      });

      const isUntampered = CryptographicLedgerSigner.verifyIntegrity(originalHash, {
        transactionUuid: "tx-test-002",
        companyId: "default",
        warehouseId: "wh-1",
        productId: "prod-geisha",
        quantity: 50,
        movementType: "IN_PURCHASE",
        balanceAfter: 450,
        timestamp,
      });
      expect(isUntampered).toBe(true);

      const isTampered = CryptographicLedgerSigner.verifyIntegrity(originalHash, {
        transactionUuid: "tx-test-002",
        companyId: "default",
        warehouseId: "wh-1",
        productId: "prod-geisha",
        quantity: 100, // Altered
        movementType: "IN_PURCHASE",
        balanceAfter: 500,
        timestamp,
      });
      expect(isTampered).toBe(false);
    });
  });
});
