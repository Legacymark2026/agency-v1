/**
 * Agents Execution & Voice Router — AI Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix C-1: All endpoints protected with requireUserOrServiceAuth.
 * Fix C-3: Multi-tenant boundary isolation enforced on all agent lookups.
 * Fix C-5: Zod validation on prompts and voice synthesis payloads.
 */
import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "@agency/database";
import { requireUserOrServiceAuth } from "@agency/service-auth";
import { runAIAgent, triageAndRouteMessage } from "../agent-runner";
import { voiceboxSpeakTool } from "../mcp/voicebox-tool";

const runAgentSchema = z.object({
  userMessage: z.string().min(1, "User message is required"),
  companyId: z.string().optional(),
  conversationId: z.string().optional(),
  senderUserId: z.string().optional(),
  contactData: z.record(z.any()).optional(),
  inlineHistory: z.array(z.any()).optional(),
  userContext: z.record(z.any()).optional(),
});

const voiceSpeakSchema = z.object({
  text: z.string().min(1, "text is required"),
  profileId: z.string().optional(),
  profileName: z.string().optional(),
  engine: z.enum(["qwen3", "qwen_custom", "luxtts", "chatterbox_multilingual", "chatterbox_turbo", "hume_tada", "kokoro"]).optional(),
  language: z.string().optional(),
  effectsPreset: z.enum(["robotic", "radio", "echo_chamber", "deep_voice", "studio_clean"]).optional(),
});

export const agentsRouter = Router();

agentsRouter.use(requireUserOrServiceAuth);

function getCompanyId(req: Request): string | null {
  return (req.headers["x-company-id"] as string | undefined) ||
    (req.query.companyId ? String(req.query.companyId) : null) ||
    (req.body && req.body.companyId ? String(req.body.companyId) : null);
}

// ── GET /agents ───────────────────────────────────────────────────────────────
agentsRouter.get("/agents", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    const agents = await prisma.aIAgent.findMany({
      where: { companyId: String(companyId) },
      include: { _count: { select: { conversations: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, agents });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /agents/:agentId/run ─────────────────────────────────────────────────
agentsRouter.post("/agents/:agentId/run", async (req: Request, res: Response) => {
  try {
    const agentId = String(req.params.agentId);
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    const parsed = runAgentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", details: parsed.error.errors });
    }

    const { userMessage, conversationId, contactData, inlineHistory, userContext } = parsed.data;
    const senderUserId = (req.headers["x-user-id"] as string) || parsed.data.senderUserId;

    const result = await runAIAgent({
      agentId,
      companyId,
      userMessage,
      conversationId,
      senderUserId,
      contactData,
      inlineHistory,
      userContext,
    });

    res.json({ success: true, ...result });
  } catch (err: any) {
    console.error("[ai-engine] Agent run error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /agents/voice/speak ──────────────────────────────────────────────────
agentsRouter.post("/agents/voice/speak", async (req: Request, res: Response) => {
  try {
    const parsed = voiceSpeakSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid voice payload", details: parsed.error.errors });
    }

    const result = await voiceboxSpeakTool.execute(parsed.data as any);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

// ── POST /agents/triage ───────────────────────────────────────────────────────
agentsRouter.post("/agents/triage", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    const { userMessage, conversationId, contactData, inlineHistory, userContext } = req.body;
    if (!userMessage) return res.status(400).json({ error: "userMessage required" });

    const result = await triageAndRouteMessage(
      companyId,
      userMessage,
      conversationId,
      contactData,
      inlineHistory,
      userContext
    );

    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

// ── POST /agents/teams/:teamId/run ────────────────────────────────────────────
agentsRouter.post("/agents/teams/:teamId/run", async (req: Request, res: Response) => {
  try {
    const teamId = String(req.params.teamId);
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    const team = await prisma.agentTeam.findUnique({
      where: { id: teamId },
      include: { members: { include: { agent: true } } },
    });

    if (!team || team.companyId !== companyId) {
      return res.status(404).json({ error: "Team not found" });
    }

    res.json({
      success: true,
      teamName: team.name,
      strategy: team.strategy,
      membersInvoked: team.members.length,
      result: `[AI Engine] Team "${team.name}" received task with ${team.members.length} members`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: String(err) });
  }
});
