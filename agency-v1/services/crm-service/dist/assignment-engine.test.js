"use strict";
/**
 * CRM Service — Unit Tests
 * ─────────────────────────────────────────────────────────────────────────────
 * Tests the evaluateCondition logic and routeLead behavior by mocking Prisma.
 * Follows the 70/20/10 principle: these are pure unit tests with no live DB.
 *
 * Coverage targets:
 *  - evaluateCondition: all operators (EQUALS, CONTAINS, STARTS_WITH, ENDS_WITH, unknown)
 *  - routeLead: missing companyId, rule matching with direct assignment,
 *    round-robin rotation, fallback global round-robin, error handling
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
// ─── vi.hoisted: declare mock fns BEFORE vi.mock is executed ──────────────────
// vi.mock() is hoisted to top-of-file by vitest's transform, so any variables
// referenced inside the factory must also be hoisted via vi.hoisted().
const { mockFindMany, mockFindUnique, mockUpsert, mockCompanyUserFindMany, mockUserFindMany, } = vitest_1.vi.hoisted(() => ({
    mockFindMany: vitest_1.vi.fn(),
    mockFindUnique: vitest_1.vi.fn(),
    mockUpsert: vitest_1.vi.fn(),
    mockCompanyUserFindMany: vitest_1.vi.fn(),
    mockUserFindMany: vitest_1.vi.fn(),
}));
vitest_1.vi.mock("@agency/database", () => ({
    prisma: {
        leadAssignmentRule: { findMany: mockFindMany },
        leadAssignmentRoundRobinState: {
            findUnique: mockFindUnique,
            upsert: mockUpsert,
        },
        companyUser: { findMany: mockCompanyUserFindMany },
        user: { findMany: mockUserFindMany },
    },
}));
// Import AFTER mocking
const assignment_engine_1 = require("./assignment-engine");
// ─── Helper: build a minimal lead object ─────────────────────────────────────
function makeLead(overrides = {}) {
    return { companyId: "company-1", email: "test@example.com", ...overrides };
}
// ─── evaluateCondition tests (via routeLead with controlled rules) ────────────
(0, vitest_1.describe)("evaluateCondition — operator coverage via routeLead integration", () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        mockCompanyUserFindMany.mockResolvedValue([]);
        mockUserFindMany.mockResolvedValue([]);
        mockFindUnique.mockResolvedValue(null);
        mockUpsert.mockResolvedValue({});
    });
    (0, vitest_1.it)("EQUALS — matches when values are equal (case-insensitive)", async () => {
        mockFindMany.mockResolvedValue([
            {
                id: "rule-1",
                name: "Email Equals Test",
                conditions: [{ field: "email", operator: "EQUALS", value: "TEST@EXAMPLE.COM" }],
                roundRobinEnabled: false,
                assignedUserId: "user-abc",
            },
        ]);
        const result = await (0, assignment_engine_1.routeLead)(makeLead({ email: "test@example.com" }));
        (0, vitest_1.expect)(result).toBe("user-abc");
    });
    (0, vitest_1.it)("EQUALS — does NOT match when values differ", async () => {
        mockFindMany.mockResolvedValue([
            {
                id: "rule-1",
                name: "Email Equals Miss",
                conditions: [{ field: "email", operator: "EQUALS", value: "other@example.com" }],
                roundRobinEnabled: false,
                assignedUserId: "user-abc",
            },
        ]);
        const result = await (0, assignment_engine_1.routeLead)(makeLead({ email: "test@example.com" }));
        (0, vitest_1.expect)(result).toBeNull();
    });
    (0, vitest_1.it)("CONTAINS — matches substring", async () => {
        mockFindMany.mockResolvedValue([
            {
                id: "rule-2",
                name: "Email Contains Test",
                conditions: [{ field: "email", operator: "CONTAINS", value: "example" }],
                roundRobinEnabled: false,
                assignedUserId: "user-xyz",
            },
        ]);
        const result = await (0, assignment_engine_1.routeLead)(makeLead({ email: "bob@example.com" }));
        (0, vitest_1.expect)(result).toBe("user-xyz");
    });
    (0, vitest_1.it)("STARTS_WITH — matches prefix", async () => {
        mockFindMany.mockResolvedValue([
            {
                id: "rule-3",
                name: "Source Starts With",
                conditions: [{ field: "source", operator: "STARTS_WITH", value: "fb" }],
                roundRobinEnabled: false,
                assignedUserId: "user-fb",
            },
        ]);
        const result = await (0, assignment_engine_1.routeLead)(makeLead({ source: "fb_ads" }));
        (0, vitest_1.expect)(result).toBe("user-fb");
    });
    (0, vitest_1.it)("ENDS_WITH — matches suffix", async () => {
        mockFindMany.mockResolvedValue([
            {
                id: "rule-4",
                name: "Domain Ends With",
                conditions: [{ field: "email", operator: "ENDS_WITH", value: ".org" }],
                roundRobinEnabled: false,
                assignedUserId: "user-org",
            },
        ]);
        const result = await (0, assignment_engine_1.routeLead)(makeLead({ email: "info@charity.org" }));
        (0, vitest_1.expect)(result).toBe("user-org");
    });
    (0, vitest_1.it)("Unknown operator — never matches", async () => {
        mockFindMany.mockResolvedValue([
            {
                id: "rule-5",
                name: "Unknown Op",
                conditions: [{ field: "email", operator: "REGEX_MATCH", value: ".*" }],
                roundRobinEnabled: false,
                assignedUserId: "user-never",
            },
        ]);
        const result = await (0, assignment_engine_1.routeLead)(makeLead());
        (0, vitest_1.expect)(result).toBeNull();
    });
    (0, vitest_1.it)("condition checks inside formData when field not at top level", async () => {
        mockFindMany.mockResolvedValue([
            {
                id: "rule-6",
                name: "FormData field",
                conditions: [{ field: "industry", operator: "EQUALS", value: "tech" }],
                roundRobinEnabled: false,
                assignedUserId: "user-tech",
            },
        ]);
        const lead = makeLead({ formData: { industry: "tech" } });
        const result = await (0, assignment_engine_1.routeLead)(lead);
        (0, vitest_1.expect)(result).toBe("user-tech");
    });
});
// ─── routeLead — Guard & fallback tests ──────────────────────────────────────
(0, vitest_1.describe)("routeLead — core routing logic", () => {
    (0, vitest_1.beforeEach)(() => vitest_1.vi.clearAllMocks());
    (0, vitest_1.it)("returns null immediately when companyId is missing", async () => {
        const result = await (0, assignment_engine_1.routeLead)({ email: "no-company@test.com" });
        (0, vitest_1.expect)(result).toBeNull();
        (0, vitest_1.expect)(mockFindMany).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)("returns null when no rules match and no company members exist", async () => {
        mockFindMany.mockResolvedValue([]);
        mockCompanyUserFindMany.mockResolvedValue([]);
        mockUserFindMany.mockResolvedValue([]);
        mockFindUnique.mockResolvedValue(null);
        mockUpsert.mockResolvedValue({});
        const result = await (0, assignment_engine_1.routeLead)(makeLead());
        (0, vitest_1.expect)(result).toBeNull();
    });
    (0, vitest_1.it)("round-robin — rotates to next agent on second call", async () => {
        const rule = {
            id: "rr-rule-1",
            name: "Round Robin Rule",
            conditions: [{ field: "source", operator: "EQUALS", value: "website" }],
            roundRobinEnabled: true,
            teamId: null,
        };
        mockFindMany.mockResolvedValue([rule]);
        mockCompanyUserFindMany.mockResolvedValue([
            { userId: "agent-a" },
            { userId: "agent-b" },
            { userId: "agent-c" },
        ]);
        mockUserFindMany.mockResolvedValue([
            { id: "agent-a" },
            { id: "agent-b" },
            { id: "agent-c" },
        ]);
        // First call: no state yet → index 0 → agent-a
        mockFindUnique.mockResolvedValueOnce(null);
        mockUpsert.mockResolvedValue({});
        const first = await (0, assignment_engine_1.routeLead)(makeLead({ source: "website" }));
        (0, vitest_1.expect)(first).toBe("agent-a");
        // Second call: state shows last was agent-a → next is agent-b
        mockFindUnique.mockResolvedValueOnce({ lastAssignedUserId: "agent-a" });
        const second = await (0, assignment_engine_1.routeLead)(makeLead({ source: "website" }));
        (0, vitest_1.expect)(second).toBe("agent-b");
    });
    (0, vitest_1.it)("round-robin — wraps around to first agent when at end", async () => {
        const rule = {
            id: "rr-rule-wrap",
            name: "Round Robin Wrap",
            conditions: [{ field: "source", operator: "EQUALS", value: "website" }],
            roundRobinEnabled: true,
            teamId: null,
        };
        mockFindMany.mockResolvedValue([rule]);
        mockCompanyUserFindMany.mockResolvedValue([
            { userId: "agent-a" },
            { userId: "agent-b" },
        ]);
        mockUserFindMany.mockResolvedValue([{ id: "agent-a" }, { id: "agent-b" }]);
        // Last assigned was agent-b (index 1) → next should be agent-a (index 0)
        mockFindUnique.mockResolvedValue({ lastAssignedUserId: "agent-b" });
        mockUpsert.mockResolvedValue({});
        const result = await (0, assignment_engine_1.routeLead)(makeLead({ source: "website" }));
        (0, vitest_1.expect)(result).toBe("agent-a");
    });
    (0, vitest_1.it)("direct assignment — returns assignedUserId when round-robin is disabled", async () => {
        mockFindMany.mockResolvedValue([
            {
                id: "direct-rule",
                name: "Direct Assignment",
                conditions: [{ field: "email", operator: "CONTAINS", value: "@vip.com" }],
                roundRobinEnabled: false,
                assignedUserId: "vip-manager",
            },
        ]);
        const result = await (0, assignment_engine_1.routeLead)(makeLead({ email: "client@vip.com" }));
        (0, vitest_1.expect)(result).toBe("vip-manager");
    });
    (0, vitest_1.it)("returns null gracefully on Prisma error", async () => {
        mockFindMany.mockRejectedValue(new Error("DB connection refused"));
        const result = await (0, assignment_engine_1.routeLead)(makeLead());
        (0, vitest_1.expect)(result).toBeNull();
    });
    (0, vitest_1.it)("fallback global round-robin — uses all company members when no rule matches", async () => {
        mockFindMany.mockResolvedValue([]);
        mockCompanyUserFindMany.mockResolvedValue([
            { userId: "fallback-a" },
            { userId: "fallback-b" },
        ]);
        mockUserFindMany.mockResolvedValue([
            { id: "fallback-a" },
            { id: "fallback-b" },
        ]);
        mockFindUnique.mockResolvedValue(null);
        mockUpsert.mockResolvedValue({});
        const result = await (0, assignment_engine_1.routeLead)(makeLead());
        (0, vitest_1.expect)(["fallback-a", "fallback-b"]).toContain(result);
    });
    (0, vitest_1.it)("rule conditions with multiple AND conditions — all must match", async () => {
        mockFindMany.mockResolvedValue([
            {
                id: "multi-cond",
                name: "Multi Condition Rule",
                conditions: [
                    { field: "source", operator: "EQUALS", value: "website" },
                    { field: "email", operator: "CONTAINS", value: "@corp.com" },
                ],
                roundRobinEnabled: false,
                assignedUserId: "corp-agent",
            },
        ]);
        mockCompanyUserFindMany.mockResolvedValue([]);
        mockUserFindMany.mockResolvedValue([]);
        mockFindUnique.mockResolvedValue(null);
        mockUpsert.mockResolvedValue({});
        // Only source matches, not email — should NOT match rule
        const noMatch = await (0, assignment_engine_1.routeLead)(makeLead({ source: "website", email: "user@gmail.com" }));
        (0, vitest_1.expect)(noMatch).toBeNull();
        // Both match — should match rule
        mockCompanyUserFindMany.mockResolvedValue([]);
        mockUserFindMany.mockResolvedValue([]);
        const match = await (0, assignment_engine_1.routeLead)(makeLead({ source: "website", email: "user@corp.com" }));
        (0, vitest_1.expect)(match).toBe("corp-agent");
    });
});
//# sourceMappingURL=assignment-engine.test.js.map