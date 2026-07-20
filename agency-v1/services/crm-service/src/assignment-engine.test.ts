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

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── vi.hoisted: declare mock fns BEFORE vi.mock is executed ──────────────────
// vi.mock() is hoisted to top-of-file by vitest's transform, so any variables
// referenced inside the factory must also be hoisted via vi.hoisted().
const {
  mockFindMany,
  mockFindUnique,
  mockUpsert,
  mockCompanyUserFindMany,
  mockUserFindMany,
} = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockFindUnique: vi.fn(),
  mockUpsert: vi.fn(),
  mockCompanyUserFindMany: vi.fn(),
  mockUserFindMany: vi.fn(),
}));

vi.mock("@agency/database", () => ({
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
import { routeLead } from "./assignment-engine";

// ─── Helper: build a minimal lead object ─────────────────────────────────────
function makeLead(overrides: Record<string, any> = {}) {
  return { companyId: "company-1", email: "test@example.com", ...overrides };
}

// ─── evaluateCondition tests (via routeLead with controlled rules) ────────────
describe("evaluateCondition — operator coverage via routeLead integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCompanyUserFindMany.mockResolvedValue([]);
    mockUserFindMany.mockResolvedValue([]);
    mockFindUnique.mockResolvedValue(null);
    mockUpsert.mockResolvedValue({});
  });

  it("EQUALS — matches when values are equal (case-insensitive)", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: "rule-1",
        name: "Email Equals Test",
        conditions: [{ field: "email", operator: "EQUALS", value: "TEST@EXAMPLE.COM" }],
        roundRobinEnabled: false,
        assignedUserId: "user-abc",
      },
    ]);

    const result = await routeLead(makeLead({ email: "test@example.com" }));
    expect(result).toBe("user-abc");
  });

  it("EQUALS — does NOT match when values differ", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: "rule-1",
        name: "Email Equals Miss",
        conditions: [{ field: "email", operator: "EQUALS", value: "other@example.com" }],
        roundRobinEnabled: false,
        assignedUserId: "user-abc",
      },
    ]);
    const result = await routeLead(makeLead({ email: "test@example.com" }));
    expect(result).toBeNull();
  });

  it("CONTAINS — matches substring", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: "rule-2",
        name: "Email Contains Test",
        conditions: [{ field: "email", operator: "CONTAINS", value: "example" }],
        roundRobinEnabled: false,
        assignedUserId: "user-xyz",
      },
    ]);

    const result = await routeLead(makeLead({ email: "bob@example.com" }));
    expect(result).toBe("user-xyz");
  });

  it("STARTS_WITH — matches prefix", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: "rule-3",
        name: "Source Starts With",
        conditions: [{ field: "source", operator: "STARTS_WITH", value: "fb" }],
        roundRobinEnabled: false,
        assignedUserId: "user-fb",
      },
    ]);

    const result = await routeLead(makeLead({ source: "fb_ads" }));
    expect(result).toBe("user-fb");
  });

  it("ENDS_WITH — matches suffix", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: "rule-4",
        name: "Domain Ends With",
        conditions: [{ field: "email", operator: "ENDS_WITH", value: ".org" }],
        roundRobinEnabled: false,
        assignedUserId: "user-org",
      },
    ]);

    const result = await routeLead(makeLead({ email: "info@charity.org" }));
    expect(result).toBe("user-org");
  });

  it("Unknown operator — never matches", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: "rule-5",
        name: "Unknown Op",
        conditions: [{ field: "email", operator: "REGEX_MATCH", value: ".*" }],
        roundRobinEnabled: false,
        assignedUserId: "user-never",
      },
    ]);

    const result = await routeLead(makeLead());
    expect(result).toBeNull();
  });

  it("condition checks inside formData when field not at top level", async () => {
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
    const result = await routeLead(lead);
    expect(result).toBe("user-tech");
  });
});

// ─── routeLead — Guard & fallback tests ──────────────────────────────────────
describe("routeLead — core routing logic", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null immediately when companyId is missing", async () => {
    const result = await routeLead({ email: "no-company@test.com" });
    expect(result).toBeNull();
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("returns null when no rules match and no company members exist", async () => {
    mockFindMany.mockResolvedValue([]);
    mockCompanyUserFindMany.mockResolvedValue([]);
    mockUserFindMany.mockResolvedValue([]);
    mockFindUnique.mockResolvedValue(null);
    mockUpsert.mockResolvedValue({});

    const result = await routeLead(makeLead());
    expect(result).toBeNull();
  });

  it("round-robin — rotates to next agent on second call", async () => {
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

    const first = await routeLead(makeLead({ source: "website" }));
    expect(first).toBe("agent-a");

    // Second call: state shows last was agent-a → next is agent-b
    mockFindUnique.mockResolvedValueOnce({ lastAssignedUserId: "agent-a" });
    const second = await routeLead(makeLead({ source: "website" }));
    expect(second).toBe("agent-b");
  });

  it("round-robin — wraps around to first agent when at end", async () => {
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

    const result = await routeLead(makeLead({ source: "website" }));
    expect(result).toBe("agent-a");
  });

  it("direct assignment — returns assignedUserId when round-robin is disabled", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: "direct-rule",
        name: "Direct Assignment",
        conditions: [{ field: "email", operator: "CONTAINS", value: "@vip.com" }],
        roundRobinEnabled: false,
        assignedUserId: "vip-manager",
      },
    ]);

    const result = await routeLead(makeLead({ email: "client@vip.com" }));
    expect(result).toBe("vip-manager");
  });

  it("returns null gracefully on Prisma error", async () => {
    mockFindMany.mockRejectedValue(new Error("DB connection refused"));

    const result = await routeLead(makeLead());
    expect(result).toBeNull();
  });

  it("fallback global round-robin — uses all company members when no rule matches", async () => {
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

    const result = await routeLead(makeLead());
    expect(["fallback-a", "fallback-b"]).toContain(result);
  });

  it("rule conditions with multiple AND conditions — all must match", async () => {
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
    const noMatch = await routeLead(makeLead({ source: "website", email: "user@gmail.com" }));
    expect(noMatch).toBeNull();

    // Both match — should match rule
    mockCompanyUserFindMany.mockResolvedValue([]);
    mockUserFindMany.mockResolvedValue([]);
    const match = await routeLead(makeLead({ source: "website", email: "user@corp.com" }));
    expect(match).toBe("corp-agent");
  });
});
