export declare class PreferencesService {
    /**
     * Da de baja (unsubscribe) a un lead de un canal de marketing específico en el CRM
     */
    static unsubscribeLead(email: string, channel: "EMAIL" | "SMS" | "WHATSAPP" | "ALL"): Promise<{
        success: boolean;
        leadId: any;
        email: any;
        unsubscribedChannel: "EMAIL" | "SMS" | "WHATSAPP" | "ALL";
        status: any;
    }>;
}
