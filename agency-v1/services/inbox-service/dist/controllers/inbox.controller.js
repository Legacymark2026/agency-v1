"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InboxController = void 0;
const inbox_service_1 = require("../services/inbox.service");
class InboxController {
    /**
     * GET /api/conversations
     */
    static async getConversations(req, res, next) {
        try {
            const companyId = String(req.headers["x-company-id"] || req.query.companyId || "");
            const result = await inbox_service_1.InboxService.getConversations(companyId || undefined, req.query.status, req.query.page ? parseInt(req.query.page, 10) : 1, req.query.limit ? parseInt(req.query.limit, 10) : 20, req.query.search);
            res.json({ success: true, ...result });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /api/conversations/:id
     */
    static async getConversationById(req, res, next) {
        try {
            const conversationId = String(req.params.id);
            const conversation = await inbox_service_1.InboxService.getConversationById(conversationId);
            if (!conversation) {
                return res.status(404).json({ success: false, error: "Conversation not found" });
            }
            res.json({ success: true, conversation });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /api/conversations/:id/messages
     */
    static async getMessages(req, res, next) {
        try {
            const conversationId = String(req.params.id);
            const messages = await inbox_service_1.InboxService.getMessages(conversationId);
            res.json({ success: true, messages });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * PATCH /api/conversations/:id
     */
    static async updateConversation(req, res, next) {
        try {
            const conversationId = String(req.params.id);
            const conversation = await inbox_service_1.InboxService.updateConversation(conversationId, req.body);
            res.json({ success: true, conversation });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/messages
     */
    static async sendMessage(req, res, next) {
        try {
            const conversationId = req.params.id || req.body.conversationId;
            const senderId = String(req.headers["x-user-id"] || req.body.senderId || "system");
            const message = await inbox_service_1.InboxService.sendMessage({
                ...req.body,
                conversationId,
                senderId
            });
            res.status(201).json({ success: true, message });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.InboxController = InboxController;
//# sourceMappingURL=inbox.controller.js.map