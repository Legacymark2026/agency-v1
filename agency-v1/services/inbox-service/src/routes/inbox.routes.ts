import { Router } from "express";
import { InboxController } from "../controllers/inbox.controller";
import { validateRequest } from "../middlewares/inbox.middleware";
import { z } from "zod";

const sendMessageSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
  content: z.string().min(1, "Content is required"),
  senderType: z.enum(["AGENT", "CUSTOMER", "BOT", "SYSTEM"]).optional().default("AGENT"),
  channel: z.string().optional(),
});

export const inboxRouter = Router();

inboxRouter.get("/conversations", InboxController.getConversations);
inboxRouter.get("/conversations/:id", InboxController.getConversationById);
inboxRouter.get("/conversations/:id/messages", InboxController.getMessages);
inboxRouter.post("/conversations/:id/messages", InboxController.sendMessage);
inboxRouter.patch("/conversations/:id", InboxController.updateConversation);
inboxRouter.post("/messages", validateRequest(sendMessageSchema), InboxController.sendMessage);

