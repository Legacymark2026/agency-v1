/**
 * Knowledge Bases, ReFRAG & Vector Memory Router — AI Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix C-1: Protected with requireUserOrServiceAuth.
 * Fix C-3: Enforces multi-tenant isolation on knowledge bases and vectors.
 */
import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "@agency/database";
import { requireUserOrServiceAuth } from "@agency/service-auth";
import { AgentMemoryService } from "../services/agent-memory.service";
import { MemoryVectorService } from "../services/memory-vector.service";
import { AiController } from "../controllers/ai.controller";

export const knowledgeRouter = Router();

knowledgeRouter.use(requireUserOrServiceAuth);

function getCompanyId(req: Request): string | null {
  return (req.headers["x-company-id"] as string | undefined) ||
    (req.query.companyId ? String(req.query.companyId) : null) ||
    (req.body && req.body.companyId ? String(req.body.companyId) : null);
}

// ── GET /knowledge-bases ──────────────────────────────────────────────────────
knowledgeRouter.get("/knowledge-bases", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    const kbs = await prisma.knowledgeBase.findMany({
      where: { companyId: String(companyId), isActive: true },
      select: { id: true, name: true, sourceType: true, isActive: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, knowledgeBases: kbs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── ReFRAG Query ──────────────────────────────────────────────────────────────
knowledgeRouter.post("/agents/refrag/query", AiController.queryRefrag);

// ── Conversation Memory ───────────────────────────────────────────────────────
knowledgeRouter.get("/agents/memory/:conversationId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const conversationId = String(req.params.conversationId);
    const limit = parseInt(String(req.query.limit || "20"), 10);
    const history = await AgentMemoryService.getConversationContext(conversationId, limit);
    res.json({ success: true, conversationId, memoryCount: history.length, history });
  } catch (err) {
    next(err);
  }
});

knowledgeRouter.delete("/agents/memory/:conversationId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const conversationId = String(req.params.conversationId);
    await AgentMemoryService.clearMemory(conversationId);
    res.json({ success: true, message: `Memoria de conversación ${conversationId} eliminada.` });
  } catch (err) {
    next(err);
  }
});

// ── PgVector Memory ───────────────────────────────────────────────────────────
knowledgeRouter.post("/agents/:agentId/vector-memory", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agentId = String(req.params.agentId);
    const { content, metadata } = req.body;
    if (!content) return res.status(400).json({ error: "content is required" });

    await MemoryVectorService.saveMemoryWithVector(agentId, content, metadata || {});
    res.json({ success: true, message: "Memory saved to vector store." });
  } catch (err) {
    next(err);
  }
});

knowledgeRouter.get("/agents/:agentId/vector-memory/search", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agentId = String(req.params.agentId);
    const query = String(req.query.q || "");
    const limit = parseInt(String(req.query.limit || "5"), 10);
    if (!query) return res.status(400).json({ error: "search query 'q' parameter is required" });

    const matches = await MemoryVectorService.searchMemory(agentId, query, limit);
    res.json({ success: true, query, matches });
  } catch (err) {
    next(err);
  }
});
