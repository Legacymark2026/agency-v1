export interface SendMessageInput {
    conversationId: string;
    senderId: string;
    senderType: "AGENT" | "CUSTOMER" | "BOT" | "SYSTEM";
    content: string;
    channel?: string;
    attachments?: any[];
}
export declare class InboxService {
    /**
     * Obtener conversaciones por companyId (o todas si companyId es opcional)
     */
    static getConversations(companyId?: string, status?: string, page?: number, limit?: number, search?: string): Promise<{
        conversations: any;
        total: any;
        page: number;
        limit: number;
    }>;
    /**
     * Obtener conversación por ID (o por Lead ID con autocreación si no existe)
     */
    static getConversationById(id: string): Promise<any>;
    /**
     * Obtener mensajes de una conversación
     */
    static getMessages(conversationId: string): Promise<any>;
    /**
     * Actualizar conversación (asignación, estado, etiquetas, etc.)
     */
    static updateConversation(id: string, data: Record<string, unknown>): Promise<any>;
    /**
     * Enviar mensaje dentro de una conversación
     */
    static sendMessage(input: SendMessageInput): Promise<any>;
}
