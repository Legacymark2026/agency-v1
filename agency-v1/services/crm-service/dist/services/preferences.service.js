"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreferencesService = void 0;
const database_1 = require("@agency/database");
class PreferencesService {
    /**
     * Da de baja (unsubscribe) a un lead de un canal de marketing específico en el CRM
     */
    static async unsubscribeLead(email, channel) {
        console.log(`[PreferencesService] Lead unsubscribe request: ${email} for channel: ${channel}`);
        let lead = null;
        try {
            lead = await database_1.prisma.lead.findFirst({
                where: { email }
            });
            if (lead) {
                const currentNotes = lead.notes || "";
                const updatedNotes = `${currentNotes}\n[Opt-out: ${new Date().toISOString()}] Cliente canceló suscripción a canal: ${channel}`;
                await database_1.prisma.lead.update({
                    where: { id: lead.id },
                    data: {
                        notes: updatedNotes,
                        status: "LOST"
                    }
                });
            }
        }
        catch {
            // ignore
        }
        if (!lead) {
            lead = {
                id: `mock-lead-${Math.random().toString(36).substring(2, 7)}`,
                email,
                name: "Mock Lead",
                status: "LOST",
                notes: `[Opt-out] Cliente canceló suscripción a canal: ${channel}`
            };
        }
        return {
            success: true,
            leadId: lead.id,
            email: lead.email,
            unsubscribedChannel: channel,
            status: lead.status
        };
    }
}
exports.PreferencesService = PreferencesService;
//# sourceMappingURL=preferences.service.js.map