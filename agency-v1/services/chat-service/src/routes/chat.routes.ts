/**
 * Chat REST Routes (HTTP Inbound Adapter)
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides REST endpoints for channel creation, user channel listing,
 * and paginated message history.
 */
import { Router, Request, Response } from "express";
import { IChatUseCases } from "../core/ports/chat.ports";
import { z } from "zod";

const createChannelSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  type: z.enum(["PUBLIC", "PRIVATE", "DIRECT_MESSAGE"]).default("PUBLIC"),
  memberIds: z.array(z.string()).optional()
});

const sendMessageSchema = z.object({
  content: z.string().min(1),
  type: z.enum(["TEXT", "IMAGE", "FILE", "RICHTEXT_CARD"]).default("TEXT"),
  metadata: z.record(z.any()).optional()
});

export function createChatRouter(chatUseCases: IChatUseCases): Router {
  const router = Router();

  // Middleware helper to extract tenant & user context
  const getContext = (req: Request) => {
    const companyId = (req.headers["x-company-id"] as string) || (req.query.companyId as string);
    const userId = (req.headers["x-user-id"] as string) || (req.query.userId as string);
    const userName = (req.headers["x-user-name"] as string) || "User";
    if (!companyId) throw new Error("Missing x-company-id header");
    if (!userId) throw new Error("Missing x-user-id header");
    return { companyId, userId, userName };
  };

  // List user channels
  router.get("/channels", async (req: Request, res: Response) => {
    try {
      const { companyId, userId } = getContext(req);
      const channels = await chatUseCases.listUserChannels(companyId, userId);
      res.json({ success: true, data: channels });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Create new channel
  router.post("/channels", async (req: Request, res: Response) => {
    try {
      const { companyId, userId } = getContext(req);
      const parsed = createChannelSchema.parse(req.body);
      const channel = await chatUseCases.createChannel({
        companyId,
        name: parsed.name,
        description: parsed.description,
        type: parsed.type,
        createdById: userId,
        memberIds: parsed.memberIds
      });
      res.status(201).json({ success: true, data: channel });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Get channel message history (cursor paginated)
  router.get("/channels/:channelId/messages", async (req: Request, res: Response) => {
    try {
      const { companyId } = getContext(req);
      const { channelId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const beforeCursor = req.query.before as string | undefined;

      const messages = await chatUseCases.getChannelMessages(companyId, channelId, limit, beforeCursor);
      res.json({ success: true, data: messages, count: messages.length });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Send message via REST (alternative to WebSocket)
  router.post("/channels/:channelId/messages", async (req: Request, res: Response) => {
    try {
      const { companyId, userId, userName } = getContext(req);
      const { channelId } = req.params;
      const parsed = sendMessageSchema.parse(req.body);

      const message = await chatUseCases.sendMessage({
        companyId,
        channelId,
        senderId: userId,
        senderName: userName,
        content: parsed.content,
        type: parsed.type,
        metadata: parsed.metadata
      });

      res.status(201).json({ success: true, data: message });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  return router;
}
