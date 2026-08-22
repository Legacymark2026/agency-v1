import { Request, Response, NextFunction } from "express";
import { InboxService } from "../services/inbox.service";

export class InboxController {
  /**
   * GET /api/conversations
   */
  static async getConversations(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = String(req.headers["x-company-id"] || req.query.companyId || "");

      const result = await InboxService.getConversations(
        companyId || undefined,
        req.query.status as string,
        req.query.page ? parseInt(req.query.page as string, 10) : 1,
        req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
        req.query.search as string
      );

      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/conversations/:id
   */
  static async getConversationById(req: Request, res: Response, next: NextFunction) {
    try {
      const conversationId = String(req.params.id);
      const conversation = await InboxService.getConversationById(conversationId);

      if (!conversation) {
        return res.status(404).json({ success: false, error: "Conversation not found" });
      }

      res.json({ success: true, conversation });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/conversations/:id/messages
   */
  static async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const conversationId = String(req.params.id);
      const messages = await InboxService.getMessages(conversationId);

      res.json({ success: true, messages });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/conversations/:id
   */
  static async updateConversation(req: Request, res: Response, next: NextFunction) {
    try {
      const conversationId = String(req.params.id);
      const conversation = await InboxService.updateConversation(conversationId, req.body);

      res.json({ success: true, conversation });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/messages
   */
  static async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const conversationId = req.params.id || req.body.conversationId;
      const senderId = String(req.headers["x-user-id"] || req.body.senderId || "system");
      const message = await InboxService.sendMessage({
        ...req.body,
        conversationId,
        senderId
      });

      res.status(201).json({ success: true, message });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/conversations/:id/analyze-sentiment
   */
  static async analyzeSentiment(req: Request, res: Response, next: NextFunction) {
    try {
      const conversationId = String(req.params.id);
      const messages = await InboxService.getMessages(conversationId);
      const lastMsg = messages[messages.length - 1];
      const textToAnalyze = lastMsg ? lastMsg.content : "No messages found";
      
      const { InboxAnalysisService } = await import("../services/inbox-analysis.service");
      const analysis = await InboxAnalysisService.analyzeSentiment(textToAnalyze);
      res.json({ success: true, conversationId, lastMessage: textToAnalyze, ...analysis });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/conversations/:id/suggested-reply
   */
  static async getSuggestedReply(req: Request, res: Response, next: NextFunction) {
    try {
      const conversationId = String(req.params.id);
      const { InboxAnalysisService } = await import("../services/inbox-analysis.service");
      const suggestion = await InboxAnalysisService.generateSuggestedReply(conversationId);
      res.json({ success: true, conversationId, suggestion });
    } catch (err) {
      next(err);
    }
  }
}

