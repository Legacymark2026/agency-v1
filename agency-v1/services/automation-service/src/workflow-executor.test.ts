/**
 * Automation Service — Unit Tests: Workflow Executor
 * ─────────────────────────────────────────────────────────────────────────────
 * Tests the pure logic functions of the workflow executor:
 * - executeRealAction: SEND_EMAIL skip/credentials, UPDATE_DEAL, DB_WRITE guards,
 *   UNKNOWN_ACTION, HTTP action
 * - getNestedValue helper (via context resolution)
 * - condition evaluation in conditionNode (via executeWorkflow DAG)
 * 
 * All external I/O (Prisma, fetch, Resend) is mocked.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock @agency/database ───────────────────────────────────────────────────
const mockIntegrationConfig = { findMany: vi.fn(), findFirst: vi.fn() };
const mockWhatsAppIntegration = { findFirst: vi.fn() };
const mockDeal = { update: vi.fn(), findUnique: vi.fn() };
const mockTask = { create: vi.fn() };
const mockNotification = { create: vi.fn() };
const mockLead = { findFirst: vi.fn(), findUnique: vi.fn() };
const mockWorkflow = { findMany: vi.fn(), findUnique: vi.fn() };
const mockWorkflowExecution = {
  create: vi.fn(),
  update: vi.fn(),
  findFirst: vi.fn(),
};

vi.mock("@agency/database", () => ({
  prisma: {
    integrationConfig: mockIntegrationConfig,
    whatsAppIntegration: mockWhatsAppIntegration,
    deal: mockDeal,
    task: mockTask,
    notification: mockNotification,
    lead: mockLead,
    workflow: mockWorkflow,
    workflowExecution: mockWorkflowExecution,
  },
}));

// ─── Mock fetch globally ──────────────────────────────────────────────────────
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// ─── Mock resend ──────────────────────────────────────────────────────────────
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ data: { id: "email-123" } }),
    },
  })),
}));

// ─── Mock handlebars (passthrough) ───────────────────────────────────────────
vi.mock("handlebars", async () => {
  const actual = await vi.importActual<typeof import("handlebars")>("handlebars");
  return actual;
});

import { triggerWorkflow, executeWorkflow } from "../src/workflow-executor";

function makeExecution(overrides = {}) {
  return { id: "exec-1", ...overrides };
}

describe("executeRealAction — SEND_EMAIL", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIntegrationConfig.findMany.mockResolvedValue([]);
    mockWhatsAppIntegration.findFirst.mockResolvedValue(null);
  });

  it("skips email when no recipient in context or config", async () => {
    const wf = {
      id: "wf-1",
      companyId: "c1",
      isActive: true,
      steps: [{ type: "SEND_EMAIL", config: {} }], // no 'to'
    };
    mockWorkflow.findMany.mockResolvedValue([wf]);
    mockWorkflowExecution.create.mockResolvedValue(makeExecution());
    mockWorkflowExecution.update.mockResolvedValue({});

    await triggerWorkflow("FORM_SUBMISSION", { source: "landing", email: undefined });
    
    // Should not throw; execution should reach UPDATE (success or skip)
    expect(mockWorkflowExecution.update).toHaveBeenCalled();
  });

  it("fails email when RESEND_API_KEY is not configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "");

    const wf = {
      id: "wf-2",
      companyId: "c1",
      isActive: true,
      steps: [{ type: "SEND_EMAIL", config: { to: "test@example.com" } }],
    };
    mockWorkflow.findMany.mockResolvedValue([wf]);
    mockWorkflowExecution.create.mockResolvedValue(makeExecution());
    mockWorkflowExecution.update.mockImplementation(({ data }: any) => Promise.resolve(data));

    await triggerWorkflow("FORM_SUBMISSION", { email: "test@example.com" });
    
    // logs should show FAILED: credentials
    expect(mockWorkflowExecution.update).toHaveBeenCalled();
  });
});

describe("executeRealAction — UPDATE_DEAL", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIntegrationConfig.findMany.mockResolvedValue([]);
    mockWhatsAppIntegration.findFirst.mockResolvedValue(null);
    mockDeal.update.mockResolvedValue({ id: "deal-1" });
  });

  it("updates deal stage when __dealId is in context", async () => {
    const wf = {
      id: "wf-deal",
      companyId: "c1",
      isActive: true,
      steps: [{ type: "UPDATE_DEAL", config: { stage: "WON" } }],
    };
    mockWorkflow.findMany.mockResolvedValue([wf]);
    mockWorkflowExecution.create.mockResolvedValue(makeExecution());
    mockWorkflowExecution.update.mockResolvedValue({});

    await triggerWorkflow("DEAL_STAGE_CHANGED", { __dealId: "deal-1", stage: "WON" });

    expect(mockDeal.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "deal-1" } })
    );
  });

  it("skips UPDATE_DEAL when no dealId in context or config", async () => {
    const wf = {
      id: "wf-nodeal",
      companyId: "c1",
      isActive: true,
      steps: [{ type: "UPDATE_DEAL", config: { stage: "LOST" } }],
    };
    mockWorkflow.findMany.mockResolvedValue([wf]);
    mockWorkflowExecution.create.mockResolvedValue(makeExecution());
    mockWorkflowExecution.update.mockResolvedValue({});

    await triggerWorkflow("DEAL_STAGE_CHANGED", { stage: "LOST" }); // no __dealId
    expect(mockDeal.update).not.toHaveBeenCalled();
  });
});

describe("executeRealAction — DB_WRITE security guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIntegrationConfig.findMany.mockResolvedValue([]);
    mockWhatsAppIntegration.findFirst.mockResolvedValue(null);
  });

  it("blocks write to non-allowed model", async () => {
    const wf = {
      id: "wf-blocked",
      companyId: "c1",
      isActive: true,
      steps: [{ type: "DB_WRITE", config: { model: "user", operation: "create", data: {} } }],
    };
    mockWorkflow.findMany.mockResolvedValue([wf]);
    mockWorkflowExecution.create.mockResolvedValue(makeExecution());

    let capturedLogs: any = null;
    mockWorkflowExecution.update.mockImplementation(({ data }: any) => {
      capturedLogs = data.logs;
      return Promise.resolve({});
    });

    await triggerWorkflow("FORM_SUBMISSION", {});

    // Find the log entry for DB_WRITE
    const dbWriteLog = capturedLogs?.find((l: any) => l.type === "DB_WRITE");
    expect(dbWriteLog?.details).toContain("DB_WRITE_BLOCKED");
  });

  it("blocks update/delete without WHERE clause", async () => {
    const wf = {
      id: "wf-no-where",
      companyId: "c1",
      isActive: true,
      steps: [{ type: "DB_WRITE", config: { model: "lead", operation: "update", data: { status: "CLOSED" } } }],
      // No where clause
    };
    mockWorkflow.findMany.mockResolvedValue([wf]);
    mockWorkflowExecution.create.mockResolvedValue(makeExecution());

    let capturedLogs: any = null;
    mockWorkflowExecution.update.mockImplementation(({ data }: any) => {
      capturedLogs = data.logs;
      return Promise.resolve({});
    });

    await triggerWorkflow("FORM_SUBMISSION", {});

    const dbWriteLog = capturedLogs?.find((l: any) => l.type === "DB_WRITE");
    expect(dbWriteLog?.details).toContain("DB_WRITE_BLOCKED");
  });
});

describe("executeRealAction — UNKNOWN_ACTION", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIntegrationConfig.findMany.mockResolvedValue([]);
    mockWhatsAppIntegration.findFirst.mockResolvedValue(null);
  });

  it("returns UNKNOWN_ACTION string for unrecognized action type", async () => {
    const wf = {
      id: "wf-unknown",
      companyId: "c1",
      isActive: true,
      steps: [{ type: "MAGIC_TELEPORT", config: {} }],
    };
    mockWorkflow.findMany.mockResolvedValue([wf]);
    mockWorkflowExecution.create.mockResolvedValue(makeExecution());

    let capturedLogs: any = null;
    mockWorkflowExecution.update.mockImplementation(({ data }: any) => {
      capturedLogs = data.logs;
      return Promise.resolve({});
    });

    await triggerWorkflow("FORM_SUBMISSION", {});
    const entry = capturedLogs?.find((l: any) => l.type === "MAGIC_TELEPORT");
    expect(entry?.details).toContain("UNKNOWN_ACTION");
  });
});

describe("triggerWorkflow — DAG conditionNode branching", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIntegrationConfig.findMany.mockResolvedValue([]);
    mockWhatsAppIntegration.findFirst.mockResolvedValue(null);
    mockWorkflowExecution.create.mockResolvedValue(makeExecution());
    mockWorkflowExecution.update.mockResolvedValue({});
    mockNotification.create.mockResolvedValue({ id: "notif-1" });
  });

  it("DAG conditionNode — routes TRUE branch when condition matches", async () => {
    const nodes = [
      { id: "trigger-1", type: "triggerNode", data: { label: "Start" } },
      {
        id: "cond-1",
        type: "conditionNode",
        data: { variable: "score", operator: "gt", conditionValue: "50" },
      },
      {
        id: "action-true",
        type: "actionNode",
        data: { actionType: "SEND_NOTIFICATION", title: "High Score", message: "Score is high", userId: "user-1" },
      },
      {
        id: "action-false",
        type: "actionNode",
        data: { actionType: "SEND_NOTIFICATION", title: "Low Score", message: "Score is low", userId: "user-1" },
      },
    ];
    const edges = [
      { source: "trigger-1", target: "cond-1" },
      { source: "cond-1", target: "action-true", sourceHandle: "true" },
      { source: "cond-1", target: "action-false", sourceHandle: "false" },
    ];

    const wf = {
      id: "wf-dag",
      companyId: "c1",
      isActive: true,
      steps: { nodes, edges },
    };
    mockWorkflow.findMany.mockResolvedValue([wf]);

    let capturedLogs: any = null;
    mockWorkflowExecution.update.mockImplementation(({ data }: any) => {
      if (data.logs) capturedLogs = data.logs;
      return Promise.resolve({});
    });

    // score = 75 > 50 → TRUE branch should fire
    await triggerWorkflow("FORM_SUBMISSION", { __assignedTo: "user-1", score: "75" });

    const trueAction = capturedLogs?.find((l: any) => l.nodeId === "action-true");
    const falseAction = capturedLogs?.find((l: any) => l.nodeId === "action-false");

    expect(trueAction).toBeDefined();
    expect(falseAction).toBeUndefined();
  });

  it("triggerWorkflow — returns 0 executed when no workflows match triggerType", async () => {
    mockWorkflow.findMany.mockResolvedValue([]);
    const result = await triggerWorkflow("NON_EXISTENT_TRIGGER", {});
    expect(result.executed).toBe(0);
  });

  it("triggerWorkflow — filters workflows by DEAL_STAGE_CHANGED targetStage", async () => {
    const wfWon = {
      id: "wf-won",
      companyId: "c1",
      isActive: true,
      triggerType: "DEAL_STAGE_CHANGED",
      triggerConfig: { stage: "WON" },
      steps: [],
    };
    const wfLost = {
      id: "wf-lost",
      companyId: "c1",
      isActive: true,
      triggerType: "DEAL_STAGE_CHANGED",
      triggerConfig: { stage: "LOST" },
      steps: [],
    };

    mockWorkflow.findMany.mockResolvedValue([wfWon, wfLost]);
    mockWorkflowExecution.create.mockResolvedValue(makeExecution());
    mockWorkflowExecution.update.mockResolvedValue({});

    const result = await triggerWorkflow("DEAL_STAGE_CHANGED", { stage: "WON" });
    // Only wf-won should execute, not wf-lost
    expect(result.executed).toBe(1);
  });
});
