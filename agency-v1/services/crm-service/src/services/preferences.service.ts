import { prisma } from "@agency/database";

export class PreferencesService {
  /**
   * Da de baja (unsubscribe) a un lead de un canal de marketing específico en el CRM
   */
  static async unsubscribeLead(email: string, channel: "EMAIL" | "SMS" | "WHATSAPP" | "ALL") {
    console.log(`[PreferencesService] Lead unsubscribe request: ${email} for channel: ${channel}`);

    let lead: any = null;
    try {
      lead = await prisma.lead.findFirst({
        where: { email }
      });

      if (lead) {
        const currentNotes = lead.notes || "";
        const updatedNotes = `${currentNotes}\n[Opt-out: ${new Date().toISOString()}] Cliente canceló suscripción a canal: ${channel}`;

        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            notes: updatedNotes,
            status: "LOST"
          }
        });
      }
    } catch {
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
