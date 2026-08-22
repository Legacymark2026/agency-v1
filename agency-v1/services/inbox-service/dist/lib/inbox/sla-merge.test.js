"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
// ─── Mock logger ──────────────────────────────────────────────────────────────
vitest_1.vi.mock("./logger", () => ({
    logger: {
        info: vitest_1.vi.fn(),
        warn: vitest_1.vi.fn(),
        error: vitest_1.vi.fn(),
    },
}));
// ─── Mock audit ───────────────────────────────────────────────────────────────
vitest_1.vi.mock("./audit", () => ({
    logAuditEvent: vitest_1.vi.fn().mockResolvedValue(undefined),
}));
// ─── Mock Prisma — use vi.hoisted so fns are available when vi.mock is hoisted ──
const { mockConversationSLA, mockConversation, mockMessage, mockMessageDraft, mockInboxTagAssignment, mockInboxAuditLog, } = vitest_1.vi.hoisted(() => ({
    mockConversationSLA: { findUnique: vitest_1.vi.fn(), create: vitest_1.vi.fn(), update: vitest_1.vi.fn() },
    mockConversation: { findUnique: vitest_1.vi.fn(), findMany: vitest_1.vi.fn(), update: vitest_1.vi.fn(), delete: vitest_1.vi.fn() },
    mockMessage: { updateMany: vitest_1.vi.fn() },
    mockMessageDraft: { updateMany: vitest_1.vi.fn() },
    mockInboxTagAssignment: { updateMany: vitest_1.vi.fn() },
    mockInboxAuditLog: { updateMany: vitest_1.vi.fn() },
}));
vitest_1.vi.mock("@agency/database", () => ({
    prisma: {
        conversationSLA: mockConversationSLA,
        conversation: mockConversation,
        message: mockMessage,
        messageDraft: mockMessageDraft,
        inboxTagAssignment: mockInboxTagAssignment,
        inboxAuditLog: mockInboxAuditLog,
    },
}));
const sla_1 = require("./sla");
const merge_1 = require("./merge");
// ─── SLA Tests ───────────────────────────────────────────────────────────────
(0, vitest_1.describe)("getSLAConfig", () => {
    (0, vitest_1.it)("returns default SLA config (60min first response, 1440min resolution)", async () => {
        const config = await (0, sla_1.getSLAConfig)("company-1");
        (0, vitest_1.expect)(config.firstResponseMinutes).toBe(60);
        (0, vitest_1.expect)(config.resolutionMinutes).toBe(1440);
    });
});
(0, vitest_1.describe)("getSLAWarning — status thresholds", () => {
    (0, vitest_1.beforeEach)(() => vitest_1.vi.clearAllMocks());
    (0, vitest_1.it)("returns null when no SLA record exists", async () => {
        mockConversationSLA.findUnique.mockResolvedValue(null);
        const result = await (0, sla_1.getSLAWarning)("conv-missing");
        (0, vitest_1.expect)(result).toBeNull();
    });
    (0, vitest_1.it)("returns { status: 'OK', percentage: 100 } when resolved without breach", async () => {
        mockConversationSLA.findUnique.mockResolvedValue({
            resolvedAt: new Date(),
            breachedAt: null,
            firstResponseAt: new Date(),
            firstResponseMinutes: 60,
            resolutionMinutes: 1440,
            pausedMinutes: 0,
            createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
        });
        const result = await (0, sla_1.getSLAWarning)("conv-ok");
        (0, vitest_1.expect)(result).toEqual({ status: "OK", percentage: 100 });
    });
    (0, vitest_1.it)("returns { status: 'BREACHED', percentage: 100 } when breachedAt is set", async () => {
        mockConversationSLA.findUnique.mockResolvedValue({
            resolvedAt: null,
            breachedAt: new Date(),
            firstResponseAt: null,
            firstResponseMinutes: 60,
            resolutionMinutes: 1440,
            pausedMinutes: 0,
            createdAt: new Date(Date.now() - 90 * 60 * 1000), // 90 min ago
        });
        const result = await (0, sla_1.getSLAWarning)("conv-breached");
        (0, vitest_1.expect)(result?.status).toBe("BREACHED");
        (0, vitest_1.expect)(result?.percentage).toBe(100);
    });
    (0, vitest_1.it)("returns 'OK' status when time used < 60% of limit", async () => {
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
        const result = await (0, sla_1.getSLAWarning)("conv-ok-threshold");
        (0, vitest_1.expect)(result?.status).toBe("OK");
        (0, vitest_1.expect)(result.percentage).toBeLessThan(60);
    });
    (0, vitest_1.it)("returns 'WARNING' status when time used ≥ 60% but < 80%", async () => {
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
        const result = await (0, sla_1.getSLAWarning)("conv-warning");
        (0, vitest_1.expect)(result?.status).toBe("WARNING");
        (0, vitest_1.expect)(result.percentage).toBeGreaterThanOrEqual(60);
        (0, vitest_1.expect)(result.percentage).toBeLessThan(80);
    });
    (0, vitest_1.it)("returns 'CRITICAL' status when time used ≥ 80% but < 100%", async () => {
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
        const result = await (0, sla_1.getSLAWarning)("conv-critical");
        (0, vitest_1.expect)(result?.status).toBe("CRITICAL");
        (0, vitest_1.expect)(result.percentage).toBeGreaterThanOrEqual(80);
    });
    (0, vitest_1.it)("caps percentage at 100 even when way overdue", async () => {
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
        const result = await (0, sla_1.getSLAWarning)("conv-overdue");
        (0, vitest_1.expect)(result?.percentage).toBe(100);
        (0, vitest_1.expect)(result?.status).toBe("BREACHED");
    });
    (0, vitest_1.it)("accounts for pausedMinutes in percentage calculation", async () => {
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
        const result = await (0, sla_1.getSLAWarning)("conv-paused");
        (0, vitest_1.expect)(result?.status).toBe("OK");
        (0, vitest_1.expect)(result.percentage).toBeLessThan(60);
    });
});
// ─── Merge Tests ──────────────────────────────────────────────────────────────
(0, vitest_1.describe)("mergeConversations", () => {
    (0, vitest_1.beforeEach)(() => vitest_1.vi.clearAllMocks());
    (0, vitest_1.it)("throws when primary conversation does not exist", async () => {
        mockConversation.findUnique
            .mockResolvedValueOnce(null) // primary not found
            .mockResolvedValueOnce({ id: "secondary", companyId: "c1" });
        await (0, vitest_1.expect)((0, merge_1.mergeConversations)("primary", "secondary", "c1", "user-1")).rejects.toThrow("no existen");
    });
    (0, vitest_1.it)("throws when secondary conversation does not exist", async () => {
        mockConversation.findUnique
            .mockResolvedValueOnce({ id: "primary", companyId: "c1" })
            .mockResolvedValueOnce(null); // secondary not found
        await (0, vitest_1.expect)((0, merge_1.mergeConversations)("primary", "secondary", "c1", "user-1")).rejects.toThrow("no existen");
    });
    (0, vitest_1.it)("throws when conversations belong to different companies", async () => {
        mockConversation.findUnique
            .mockResolvedValueOnce({ id: "primary", companyId: "c1" })
            .mockResolvedValueOnce({ id: "secondary", companyId: "c2" }); // different company
        await (0, vitest_1.expect)((0, merge_1.mergeConversations)("primary", "secondary", "c1", "user-1")).rejects.toThrow("misma compañía");
    });
    (0, vitest_1.it)("successfully merges two conversations and returns true", async () => {
        mockConversation.findUnique
            .mockResolvedValueOnce({ id: "primary", companyId: "c1", tags: ["tag-a"], metadata: { foo: "bar" } })
            .mockResolvedValueOnce({ id: "secondary", companyId: "c1", tags: ["tag-b"], metadata: { baz: "qux" } });
        mockMessage.updateMany.mockResolvedValue({ count: 3 });
        mockMessageDraft.updateMany.mockResolvedValue({ count: 0 });
        mockInboxTagAssignment.updateMany.mockResolvedValue({ count: 2 });
        mockInboxAuditLog.updateMany.mockResolvedValue({ count: 1 });
        mockConversation.update.mockResolvedValue({});
        mockConversation.delete.mockResolvedValue({});
        const result = await (0, merge_1.mergeConversations)("primary", "secondary", "c1", "user-1");
        (0, vitest_1.expect)(result).toBe(true);
        // Verify messages were moved
        (0, vitest_1.expect)(mockMessage.updateMany).toHaveBeenCalledWith({
            where: { conversationId: "secondary" },
            data: { conversationId: "primary" },
        });
        // Verify secondary was deleted
        (0, vitest_1.expect)(mockConversation.delete).toHaveBeenCalledWith({
            where: { id: "secondary" },
        });
    });
    (0, vitest_1.it)("merges tags from both conversations (deduplicates)", async () => {
        mockConversation.findUnique
            .mockResolvedValueOnce({ id: "p", companyId: "c1", tags: ["crm", "hot"], metadata: {} })
            .mockResolvedValueOnce({ id: "s", companyId: "c1", tags: ["hot", "vip"], metadata: {} });
        mockMessage.updateMany.mockResolvedValue({});
        mockMessageDraft.updateMany.mockResolvedValue({});
        mockInboxTagAssignment.updateMany.mockResolvedValue({});
        mockInboxAuditLog.updateMany.mockResolvedValue({});
        mockConversation.delete.mockResolvedValue({});
        let capturedUpdateData = null;
        mockConversation.update.mockImplementation(({ data }) => {
            capturedUpdateData = data;
            return Promise.resolve({});
        });
        await (0, merge_1.mergeConversations)("p", "s", "c1", "user-1");
        // Should contain all tags, deduplicated
        (0, vitest_1.expect)(capturedUpdateData.tags).toContain("crm");
        (0, vitest_1.expect)(capturedUpdateData.tags).toContain("hot");
        (0, vitest_1.expect)(capturedUpdateData.tags).toContain("vip");
        (0, vitest_1.expect)(capturedUpdateData.tags.filter((t) => t === "hot").length).toBe(1); // no duplicates
    });
});
(0, vitest_1.describe)("findDuplicateConversations", () => {
    (0, vitest_1.beforeEach)(() => vitest_1.vi.clearAllMocks());
    (0, vitest_1.it)("returns empty array when only one conversation exists", async () => {
        mockConversation.findMany.mockResolvedValue([
            { id: "conv-1", leadId: "lead-1", channel: "EMAIL" },
        ]);
        const result = await (0, merge_1.findDuplicateConversations)("lead-1", "EMAIL", "c1");
        (0, vitest_1.expect)(result).toEqual([]);
    });
    (0, vitest_1.it)("returns all except the most recent when duplicates exist", async () => {
        // Ordered by lastMessageAt desc — first is most recent
        mockConversation.findMany.mockResolvedValue([
            { id: "conv-newest", leadId: "lead-1", channel: "EMAIL" },
            { id: "conv-old-1", leadId: "lead-1", channel: "EMAIL" },
            { id: "conv-old-2", leadId: "lead-1", channel: "EMAIL" },
        ]);
        const result = await (0, merge_1.findDuplicateConversations)("lead-1", "EMAIL", "c1");
        (0, vitest_1.expect)(result).toHaveLength(2);
        (0, vitest_1.expect)(result.map((c) => c.id)).toEqual(["conv-old-1", "conv-old-2"]);
        (0, vitest_1.expect)(result.map((c) => c.id)).not.toContain("conv-newest");
    });
    (0, vitest_1.it)("returns empty array on Prisma error (graceful)", async () => {
        mockConversation.findMany.mockRejectedValue(new Error("DB down"));
        const result = await (0, merge_1.findDuplicateConversations)("lead-1", "EMAIL", "c1");
        (0, vitest_1.expect)(result).toEqual([]);
    });
});
//# sourceMappingURL=sla-merge.test.js.map