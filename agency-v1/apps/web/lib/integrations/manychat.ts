import { getCompanyIntegrationConfig } from "../integration-config-service";

/**
 * Tipos oficiales para el constructor de bloques dinámicos y eventos de ManyChat API v2
 */
export interface ManyChatButton {
    type: "url" | "node" | "flow" | "call" | "buy";
    caption: string;
    url?: string;
    target?: string;
    phone?: string;
}

export interface ManyChatQuickReply {
    type: "node" | "flow" | "dynamic";
    caption: string;
    target?: string;
}

export interface ManyChatAction {
    action: "add_tag" | "remove_tag" | "set_field_value" | "clear_field_value";
    tag_name?: string;
    field_name?: string;
    value?: string | number | boolean;
}

export interface ManyChatTextMessage {
    type: "text";
    text: string;
    buttons?: ManyChatButton[];
}

export interface ManyChatCardMessage {
    type: "card";
    title: string;
    subtitle?: string;
    image_url?: string;
    action_url?: string;
    buttons?: ManyChatButton[];
}

export interface ManyChatImageMessage {
    type: "image";
    url: string;
    buttons?: ManyChatButton[];
}

export type ManyChatMessage = ManyChatTextMessage | ManyChatCardMessage | ManyChatImageMessage;

export interface ManyChatDynamicResponse {
    version: "v2";
    content: {
        messages: ManyChatMessage[];
        actions?: ManyChatAction[];
        quick_replies?: ManyChatQuickReply[];
    };
}

export interface ManyChatSubscriberPayload {
    subscriber_id: string | number;
    first_name?: string;
    last_name?: string;
    name?: string;
    email?: string;
    phone?: string;
    profile_pic?: string;
    gender?: string;
    live_chat_url?: string;
    channel?: "instagram" | "whatsapp" | "facebook" | "telegram" | "sms" | string;
    page_id?: string;
    custom_fields?: Record<string, unknown>;
    tags?: string[];
    last_input_text?: string;
    action?: "lead_capture" | "live_chat" | "ai_query" | "sync";
    user_question?: string;
}

export interface ManyChatApiResponse<T = unknown> {
    status: "success" | "error";
    data?: T;
    message?: string;
    error?: string;
}

export class ManyChatService {
    private apiToken?: string;
    private baseUrl = "https://api.manychat.com/fb";

    constructor(token?: string) {
        this.apiToken = token || process.env.MANYCHAT_API_TOKEN;
    }

    /**
     * Inicializa o crea una instancia configurada para una compañía específica (soporte Multi-tenant)
     */
    static async forCompany(companyId: string): Promise<ManyChatService> {
        let token = process.env.MANYCHAT_API_TOKEN;
        try {
            const config = (await getCompanyIntegrationConfig(companyId, "manychat")) as { apiToken?: string; apiKey?: string } | null;
            if (config?.apiToken || config?.apiKey) {
                token = config.apiToken || config.apiKey;
            }
        } catch (err) {
            console.warn(`[ManyChatService] Could not load company config for ${companyId}:`, err);
        }
        return new ManyChatService(token);
    }

    private getHeaders(): Record<string, string> {
        if (!this.apiToken) {
            throw new Error("ManyChat API Token is missing. Configure MANYCHAT_API_TOKEN in env or IntegrationConfig.");
        }
        return {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiToken}`,
            Accept: "application/json",
        };
    }

    /**
     * Pausa la automatización del bot en ManyChat (crucial para Live Chat Handover / Asesor Humano)
     */
    async pauseBot(subscriberId: string | number): Promise<ManyChatApiResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/subscriber/pauseBot`, {
                method: "POST",
                headers: this.getHeaders(),
                body: JSON.stringify({ subscriber_id: subscriberId }),
            });

            const data = await response.json();
            return {
                status: response.ok ? "success" : "error",
                data,
                message: response.ok ? "Bot paused successfully" : data?.message || "Failed to pause bot",
            };
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            console.error("[ManyChatService] pauseBot error:", msg);
            return { status: "error", error: msg };
        }
    }

    /**
     * Reanuda la automatización del bot en ManyChat
     */
    async resumeBot(subscriberId: string | number): Promise<ManyChatApiResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/subscriber/resumeBot`, {
                method: "POST",
                headers: this.getHeaders(),
                body: JSON.stringify({ subscriber_id: subscriberId }),
            });

            const data = await response.json();
            return {
                status: response.ok ? "success" : "error",
                data,
                message: response.ok ? "Bot resumed successfully" : data?.message || "Failed to resume bot",
            };
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            console.error("[ManyChatService] resumeBot error:", msg);
            return { status: "error", error: msg };
        }
    }

    /**
     * Asigna un campo personalizado (Custom Field) al suscriptor por nombre
     */
    async setCustomField(subscriberId: string | number, fieldName: string, value: string | number | boolean): Promise<ManyChatApiResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/subscriber/setCustomFieldByName`, {
                method: "POST",
                headers: this.getHeaders(),
                body: JSON.stringify({
                    subscriber_id: subscriberId,
                    field_name: fieldName,
                    field_value: value,
                }),
            });

            const data = await response.json();
            return {
                status: response.ok ? "success" : "error",
                data,
                message: response.ok ? `Custom field '${fieldName}' set successfully` : data?.message,
            };
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            console.error("[ManyChatService] setCustomField error:", msg);
            return { status: "error", error: msg };
        }
    }

    /**
     * Añade una etiqueta (Tag) al suscriptor por nombre
     */
    async addTag(subscriberId: string | number, tagName: string): Promise<ManyChatApiResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/subscriber/addTagByName`, {
                method: "POST",
                headers: this.getHeaders(),
                body: JSON.stringify({
                    subscriber_id: subscriberId,
                    tag_name: tagName,
                }),
            });

            const data = await response.json();
            return {
                status: response.ok ? "success" : "error",
                data,
                message: response.ok ? `Tag '${tagName}' added successfully` : data?.message,
            };
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            console.error("[ManyChatService] addTag error:", msg);
            return { status: "error", error: msg };
        }
    }

    /**
     * Remueve una etiqueta (Tag) del suscriptor por nombre
     */
    async removeTag(subscriberId: string | number, tagName: string): Promise<ManyChatApiResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/subscriber/removeTagByName`, {
                method: "POST",
                headers: this.getHeaders(),
                body: JSON.stringify({
                    subscriber_id: subscriberId,
                    tag_name: tagName,
                }),
            });

            const data = await response.json();
            return {
                status: response.ok ? "success" : "error",
                data,
                message: response.ok ? `Tag '${tagName}' removed successfully` : data?.message,
            };
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            console.error("[ManyChatService] removeTag error:", msg);
            return { status: "error", error: msg };
        }
    }

    /**
     * Envía contenido directo o flujo hacia el suscriptor
     */
    async sendContent(subscriberId: string | number, content: ManyChatDynamicResponse["content"]): Promise<ManyChatApiResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/sending/sendContent`, {
                method: "POST",
                headers: this.getHeaders(),
                body: JSON.stringify({
                    subscriber_id: subscriberId,
                    data: {
                        version: "v2",
                        content,
                    },
                }),
            });

            const data = await response.json();
            return {
                status: response.ok ? "success" : "error",
                data,
                message: response.ok ? "Content sent successfully" : data?.message,
            };
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            console.error("[ManyChatService] sendContent error:", msg);
            return { status: "error", error: msg };
        }
    }

    /**
     * Helper estático para construir respuestas compatibles con el bloque ManyChat Dynamic Content v2
     */
    static buildDynamicResponse(params: {
        text?: string;
        messages?: ManyChatMessage[];
        actions?: ManyChatAction[];
        quickReplies?: ManyChatQuickReply[];
        buttons?: ManyChatButton[];
    }): ManyChatDynamicResponse {
        const messages: ManyChatMessage[] = [];

        if (params.text) {
            messages.push({
                type: "text",
                text: params.text,
                buttons: params.buttons || [],
            });
        }

        if (params.messages && params.messages.length > 0) {
            messages.push(...params.messages);
        }

        return {
            version: "v2",
            content: {
                messages,
                actions: params.actions || [],
                quick_replies: params.quickReplies || [],
            },
        };
    }
}
