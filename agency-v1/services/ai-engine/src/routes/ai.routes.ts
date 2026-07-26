import { Router } from "express";
import { AiController } from "../controllers/ai.controller";
import { validateRequest } from "../middlewares/ai.middleware";
import { z } from "zod";

const runAgentSchema = z.object({
  userMessage: z.string().min(1, "User message is required"),
  conversationId: z.string().optional(),
});

export const aiRouter = Router();

aiRouter.get("/agents", AiController.getAgents);
aiRouter.post("/agents/:agentId/run", validateRequest(runAgentSchema), AiController.runAgent);
