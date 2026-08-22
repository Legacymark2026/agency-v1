"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
    /**
     * GET /api/conversations/:id/analyze-sentiment
     */
    static async analyzeSentiment(req, res, next) {
        try {
            const conversationId = String(req.params.id);
            const messages = await inbox_service_1.InboxService.getMessages(conversationId);
            const lastMsg = messages[messages.length - 1];
            const textToAnalyze = lastMsg ? lastMsg.content : "No messages found";
            const { InboxAnalysisService } = await Promise.resolve().then(() => __importStar(require("../services/inbox-analysis.service")));
            const analysis = await InboxAnalysisService.analyzeSentiment(textToAnalyze);
            res.json({ success: true, conversationId, lastMessage: textToAnalyze, ...analysis });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /api/conversations/:id/suggested-reply
     */
    static async getSuggestedReply(req, res, next) {
        try {
            const conversationId = String(req.params.id);
            const { InboxAnalysisService } = await Promise.resolve().then(() => __importStar(require("../services/inbox-analysis.service")));
            const suggestion = await InboxAnalysisService.generateSuggestedReply(conversationId);
            res.json({ success: true, conversationId, suggestion });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.InboxController = InboxController;
//# sourceMappingURL=inbox.controller.js.map