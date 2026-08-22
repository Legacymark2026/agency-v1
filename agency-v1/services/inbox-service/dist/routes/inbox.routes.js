"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inboxRouter = void 0;
const express_1 = require("express");
const inbox_controller_1 = require("../controllers/inbox.controller");
const inbox_middleware_1 = require("../middlewares/inbox.middleware");
const zod_1 = require("zod");
const sendMessageSchema = zod_1.z.object({
    conversationId: zod_1.z.string().min(1, "Conversation ID is required"),
    content: zod_1.z.string().min(1, "Content is required"),
    senderType: zod_1.z.enum(["AGENT", "CUSTOMER", "BOT", "SYSTEM"]).optional().default("AGENT"),
    channel: zod_1.z.string().optional(),
});
exports.inboxRouter = (0, express_1.Router)();
exports.inboxRouter.get("/conversations", inbox_controller_1.InboxController.getConversations);
exports.inboxRouter.get("/conversations/:id", inbox_controller_1.InboxController.getConversationById);
exports.inboxRouter.get("/conversations/:id/messages", inbox_controller_1.InboxController.getMessages);
exports.inboxRouter.post("/conversations/:id/messages", inbox_controller_1.InboxController.sendMessage);
exports.inboxRouter.patch("/conversations/:id", inbox_controller_1.InboxController.updateConversation);
exports.inboxRouter.post("/messages", (0, inbox_middleware_1.validateRequest)(sendMessageSchema), inbox_controller_1.InboxController.sendMessage);
//# sourceMappingURL=inbox.routes.js.map