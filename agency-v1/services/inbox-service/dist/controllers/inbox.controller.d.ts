import { Request, Response, NextFunction } from "express";
export declare class InboxController {
    /**
     * GET /api/conversations
     */
    static getConversations(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/conversations/:id
     */
    static getConversationById(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/conversations/:id/messages
     */
    static getMessages(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * PATCH /api/conversations/:id
     */
    static updateConversation(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/messages
     */
    static sendMessage(req: Request, res: Response, next: NextFunction): Promise<void>;
}
