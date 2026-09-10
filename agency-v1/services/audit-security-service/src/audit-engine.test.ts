/**
 * Pure Unit Tests for Audit Security Service (Hexagonal 5.0)
 * Verifies cryptographic WORM chaining and tamper detection.
 */
import { describe, it, expect, vi } from "vitest";
import { AuditLedgerEngine, GENESIS_AUDIT_HASH, AuditRecordProps } from "./core/domain/audit.domain";
import { AuditSecurityUseCases } from "./core/usecases/audit.usecases";
import { IAuditRepositoryPort } from "./core/ports/audit.ports";

describe("Audit Forensic Engine — Cryptographic WORM Chain", () => {
  it("generates deterministic SHA-256 seal linked to genesis hash", () => {
    const timestamp = new Date("2026-09-10T10:00:00Z");
    const seal = AuditLedgerEngine.generateHashSeal({
      companyId: "comp-1",
      actorId: "usr-admin",
      actorEmail: "admin@legacymark.com",
      actorRole: "SUPER_ADMIN",
      action: "READ_SENSITIVE",
      resource: "ACCOUNTING",
      resourceId: "voucher-001",
      details: { fields: ["balance", "taxWithholdings"] },
      timestamp,
    }, GENESIS_AUDIT_HASH);

    expect(seal).toBeDefined();
    expect(seal.length).toBe(64); // SHA-256 is 64 hex characters
  });

  it("detects tampered log records in the chain", () => {
    const t1 = new Date("2026-09-10T10:00:00Z");
    const t2 = new Date("2026-09-10T10:05:00Z");

    const rec1Data: any = {
      companyId: "comp-1",
      actorId: "usr-1",
      actorEmail: "u1@empresa.com",
      actorRole: "ADMIN",
      action: "CREATE",
      resource: "INVOICE",
      details: {},
      timestamp: t1,
    };
    const seal1 = AuditLedgerEngine.generateHashSeal(rec1Data, GENESIS_AUDIT_HASH);
    const rec1: AuditRecordProps = { id: "1", ...rec1Data, hashSeal: seal1, previousHash: GENESIS_AUDIT_HASH };

    const rec2Data: any = {
      companyId: "comp-1",
      actorId: "usr-2",
      actorEmail: "u2@empresa.com",
      actorRole: "CASHIER",
      action: "UPDATE",
      resource: "POS",
      details: {},
      timestamp: t2,
    };
    const seal2 = AuditLedgerEngine.generateHashSeal(rec2Data, seal1);
    const rec2: AuditRecordProps = { id: "2", ...rec2Data, hashSeal: seal2, previousHash: seal1 };

    // Valid chain test
    expect(AuditLedgerEngine.verifyChainIntegrity([rec1, rec2]).isValid).toBe(true);

    // Tamper test: someone altered rec1 action to DELETE
    const tamperedRec1 = { ...rec1, action: "DELETE" as any };
    expect(AuditLedgerEngine.verifyChainIntegrity([tamperedRec1, rec2]).isValid).toBe(false);
  });
});

describe("Audit Security UseCases — Hexagonal Orchestrator", () => {
  const store: AuditRecordProps[] = [];

  const mockRepo: IAuditRepositoryPort = {
    recordAuditLog: async (data) => {
      const item = { id: "log-" + (store.length + 1), ...data };
      store.push(item as any);
      return item as any;
    },
    getLatestRecord: async () => store[store.length - 1] || null,
    listAuditRecords: async () => [...store],
    searchAuditRecords: vi.fn(),
  };

  const useCases = new AuditSecurityUseCases(mockRepo);

  it("logs events sequentially with cryptographic previousHash linking", async () => {
    const log1 = await useCases.logEvent({
      companyId: "comp-1",
      actorId: "user-1",
      actorEmail: "u1@test.com",
      actorRole: "FINANCE_LEAD",
      action: "READ_SENSITIVE",
      resource: "ACCOUNTING",
      resourceId: "v-001",
    });

    expect(log1.previousHash).toBe(GENESIS_AUDIT_HASH);

    const log2 = await useCases.logEvent({
      companyId: "comp-1",
      actorId: "user-2",
      actorEmail: "u2@test.com",
      actorRole: "ADMIN",
      action: "EXPORT",
      resource: "INVOICE",
    });

    expect(log2.previousHash).toBe(log1.hashSeal);

    const verification = await useCases.verifyAuditIntegrity("comp-1");
    expect(verification.isValid).toBe(true);
    expect(verification.totalVerified).toBe(2);
  });
});
