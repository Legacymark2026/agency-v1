/**
 * Inbox Service — Unit Tests: SLA & Merge Logic
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure unit tests with mocked Prisma — no live DB required.
 *
 * Coverage targets:
 *  - SLA: getSLAConfig defaults, getSLAWarning status thresholds (OK/WARNING/CRITICAL/BREACHED)
 *  - Merge: mergeConversations validation, successful merge, error propagation
 *  - findDuplicateConversations: no duplicates, returns all except most recent
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock logger ──────────────────────────────────────────────────────────────
vi.mock("../src/lib/inbox/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// ─── Mock audit ───────────────────────────────────────────────────────────────
vi.mock("../src/lib/inbox/audit", () => ({
  logAuditEvent: vi.fn().mockResolvedValue(undefined),
}));

// ─── Mock Prisma ─────────────────────────────────────────────────────────────
const mockConversationSLA = {
  findUnique: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
};
const mockConversation = {
  findUnique: vi.fn(),
  findMany: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};
const mockMessage = { updateMany: vi.fn() };
const mockMessageDraft = { updateMany: vi.fn() };
const mockInboxTagAssignment = { updateMany: vi.fn() };
const mockInboxAuditLog = { updateMany: vi.fn() };

vi.mock("@agency/database", () => ({
  prisma: {
    conversationSLA: mockConversationSLA,
    conversation: mockConversation,
    message: mockMessage,
    messageDraft: mockMessageDraft,
    inboxTagAssignment: mockInboxTagAssignment,
    inboxAuditLog: mockInboxAuditLog,
  },
}));

import { getSLAConfig, getSLAWarning } from "../src/lib/inbox/sla";
import { mergeConversations, findDuplicateConversations } from "../src/lib/inbox/merge";

// ─── SLA Tests ───────────────────────────────────────────────────────────────
describe("getSLAConfig", () => {
  it("returns default SLA config (60min first response, 1440min resolution)", async () => {
    const config = await getSLAConfig("company-1");
    expect(config.firstResponseMinutes).toBe(60);
    expect(config.resolutionMinutes).toBe(1440);
  });
});

describe("getSLAWarning — status thresholds", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null when no SLA record exists", async () => {
    mockConversationSLA.findUnique.mockResolvedValue(null);
    const result = await getSLAWarning("conv-missing");
    expect(result).toBeNull();
  });

  it("returns { status: 'OK', percentage: 100 } when resolved without breach", async () => {
    mockConversationSLA.findUnique.mockResolvedValue({
      resolvedAt: new Date(),
      breachedAt: null,
      firstResponseAt: new Date(),
      firstResponseMinutes: 60,
      resolutionMinutes: 1440,
      pausedMinutes: 0,
      createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
    });

    const result = await getSLAWarning("conv-ok");
    expect(result).toEqual({ status: "OK", percentage: 100 });
  });

  it("returns { status: 'BREACHED', percentage: 100 } when breachedAt is set", async () => {
    mockConversationSLA.findUnique.mockResolvedValue({
      resolvedAt: null,
      breachedAt: new Date(),
      firstResponseAt: null,
      firstResponseMinutes: 60,
      resolutionMinutes: 1440,
      pausedMinutes: 0,
      createdAt: new Date(Date.now() - 90 * 60 * 1000), // 90 min ago
    });

    const result = await getSLAWarning("conv-breached");
    expect(result?.status).toBe("BREACHED");
    expect(result?.percentage).toBe(100);
  });

  it("returns 'OK' status when time used < 60% of limit", async () => {
    const createdAt = new Date(Date.now() - 20 * 60 * 1000); // 20 min ago (33% of 60min)
    mockConversationSLA.findUnique.mockResolvedValue({
      resolvedAt: null,
      breachedAt: null,
      firstResponseAt: null,
      firstResponseMinutes: 60,
      resolutionMinutes: 1440,
      pausedMinutes: 0,
      createdAt,
    });

    const result = await getSLAWarning("conv-ok-threshold");
    expect(result?.status).toBe("OK");
    expect(result!.percentage).toBeLessThan(60);
  });

  it("returns 'WARNING' status when time used ≥ 60% but < 80%", async () => {
    const createdAt = new Date(Date.now() - 41 * 60 * 1000); // 41 min = ~68% of 60min limit
    mockConversationSLA.findUnique.mockResolvedValue({
      resolvedAt: null,
      breachedAt: null,
      firstResponseAt: null,
      firstResponseMinutes: 60,
      resolutionMinutes: 1440,
      pausedMinutes: 0,
      createdAt,
    });

    const result = await getSLAWarning("conv-warning");
    expect(result?.status).toBe("WARNING");
    expect(result!.percentage).toBeGreaterThanOrEqual(60);
    expect(result!.percentage).toBeLessThan(80);
  });

  it("returns 'CRITICAL' status when time used ≥ 80% but < 100%", async () => {
    const createdAt = new Date(Date.now() - 51 * 60 * 1000); // 51 min = 85% of 60min limit
    mockConversationSLA.findUnique.mockResolvedValue({
      resolvedAt: null,
      breachedAt: null,
      firstResponseAt: null,
      firstResponseMinutes: 60,
      resolutionMinutes: 1440,
      pausedMinutes: 0,
      createdAt,
    });

    const result = await getSLAWarning("conv-critical");
    expect(result?.status).toBe("CRITICAL");
    expect(result!.percentage).toBeGreaterThanOrEqual(80);
  });

  it("caps percentage at 100 even when way overdue", async () => {
    const createdAt = new Date(Date.now() - 999 * 60 * 1000); // way overdue
    mockConversationSLA.findUnique.mockResolvedValue({
      resolvedAt: null,
      breachedAt: null,
      firstResponseAt: null,
      firstResponseMinutes: 60,
      resolutionMinutes: 1440,
      pausedMinutes: 0,
      createdAt,
    });

    const result = await getSLAWarning("conv-overdue");
    expect(result?.percentage).toBe(100);
    expect(result?.status).toBe("BREACHED");
  });

  it("accounts for pausedMinutes in percentage calculation", async () => {
    // 45 min elapsed, but 20 paused → effective 25 min (41% of 60min) → OK
    const createdAt = new Date(Date.now() - 45 * 60 * 1000);
    mockConversationSLA.findUnique.mockResolvedValue({
      resolvedAt: null,
      breachedAt: null,
      firstResponseAt: null,
      firstResponseMinutes: 60,
      resolutionMinutes: 1440,
      pausedMinutes: 20,
      createdAt,
    });

    const result = await getSLAWarning("conv-paused");
    expect(result?.status).toBe("OK");
    expect(result!.percentage).toBeLessThan(60);
  });
});

// ─── Merge Tests ──────────────────────────────────────────────────────────────
describe("mergeConversations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws when primary conversation does not exist", async () => {
    mockConversation.findUnique
      .mockResolvedValueOnce(null) // primary not found
      .mockResolvedValueOnce({ id: "secondary", companyId: "c1" });

    await expect(
      mergeConversations("primary", "secondary", "c1", "user-1")
    ).rejects.toThrow("no existen");
  });

  it("throws when secondary conversation does not exist", async () => {
    mockConversation.findUnique
      .mockResolvedValueOnce({ id: "primary", companyId: "c1" })
      .mockResolvedValueOnce(null); // secondary not found

    await expect(
      mergeConversations("primary", "secondary", "c1", "user-1")
    ).rejects.toThrow("no existen");
  });

  it("throws when conversations belong to different companies", async () => {
    mockConversation.findUnique
      .mockResolvedValueOnce({ id: "primary", companyId: "c1" })
      .mockResolvedValueOnce({ id: "secondary", companyId: "c2" }); // different company

    await expect(
      mergeConversations("primary", "secondary", "c1", "user-1")
    ).rejects.toThrow("misma compañía");
  });

  it("successfully merges two conversations and returns true", async () => {
    mockConversation.findUnique
      .mockResolvedValueOnce({ id: "primary", companyId: "c1", tags: ["tag-a"], metadata: { foo: "bar" } })
      .mockResolvedValueOnce({ id: "secondary", companyId: "c1", tags: ["tag-b"], metadata: { baz: "qux" } });

    mockMessage.updateMany.mockResolvedValue({ count: 3 });
    mockMessageDraft.updateMany.mockResolvedValue({ count: 0 });
    mockInboxTagAssignment.updateMany.mockResolvedValue({ count: 2 });
    mockInboxAuditLog.updateMany.mockResolvedValue({ count: 1 });
    mockConversation.update.mockResolvedValue({});
    mockConversation.delete.mockResolvedValue({});

    const result = await mergeConversations("primary", "secondary", "c1", "user-1");
    expect(result).toBe(true);

    // Verify messages were moved
    expect(mockMessage.updateMany).toHaveBeenCalledWith({
      where: { conversationId: "secondary" },
      data: { conversationId: "primary" },
    });

    // Verify secondary was deleted
    expect(mockConversation.delete).toHaveBeenCalledWith({
      where: { id: "secondary" },
    });
  });

  it("merges tags from both conversations (deduplicates)", async () => {
    mockConversation.findUnique
      .mockResolvedValueOnce({ id: "p", companyId: "c1", tags: ["crm", "hot"], metadata: {} })
      .mockResolvedValueOnce({ id: "s", companyId: "c1", tags: ["hot", "vip"], metadata: {} });

    mockMessage.updateMany.mockResolvedValue({});
    mockMessageDraft.updateMany.mockResolvedValue({});
    mockInboxTagAssignment.updateMany.mockResolvedValue({});
    mockInboxAuditLog.updateMany.mockResolvedValue({});
    mockConversation.delete.mockResolvedValue({});

    let capturedUpdateData: any = null;
    mockConversation.update.mockImplementation(({ data }: any) => {
      capturedUpdateData = data;
      return Promise.resolve({});
    });

    await mergeConversations("p", "s", "c1", "user-1");

    // Should contain all tags, deduplicated
    expect(capturedUpdateData.tags).toContain("crm");
    expect(capturedUpdateData.tags).toContain("hot");
    expect(capturedUpdateData.tags).toContain("vip");
    expect(capturedUpdateData.tags.filter((t: string) => t === "hot").length).toBe(1); // no duplicates
  });
});

describe("findDuplicateConversations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns empty array when only one conversation exists", async () => {
    mockConversation.findMany.mockResolvedValue([
      { id: "conv-1", leadId: "lead-1", channel: "EMAIL" },
    ]);

    const result = await findDuplicateConversations("lead-1", "EMAIL", "c1");
    expect(result).toEqual([]);
  });

  it("returns all except the most recent when duplicates exist", async () => {
    // Ordered by lastMessageAt desc — first is most recent
    mockConversation.findMany.mockResolvedValue([
      { id: "conv-newest", leadId: "lead-1", channel: "EMAIL" },
      { id: "conv-old-1", leadId: "lead-1", channel: "EMAIL" },
      { id: "conv-old-2", leadId: "lead-1", channel: "EMAIL" },
    ]);

    const result = await findDuplicateConversations("lead-1", "EMAIL", "c1");
    expect(result).toHaveLength(2);
    expect(result.map((c: any) => c.id)).toEqual(["conv-old-1", "conv-old-2"]);
    expect(result.map((c: any) => c.id)).not.toContain("conv-newest");
  });

  it("returns empty array on Prisma error (graceful)", async () => {
    mockConversation.findMany.mockRejectedValue(new Error("DB down"));
    const result = await findDuplicateConversations("lead-1", "EMAIL", "c1");
    expect(result).toEqual([]);
  });
});
