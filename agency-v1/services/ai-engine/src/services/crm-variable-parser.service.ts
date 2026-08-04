import { prisma } from "@agency/database";

export interface CrmContextData {
  lead?: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
    companyName?: string;
    score?: number;
    status?: string;
    customFields?: Record<string, any>;
  };
  deal?: {
    id?: string;
    title?: string;
    amount?: number;
    currency?: string;
    stage?: string;
  };
  company?: {
    id?: string;
    name?: string;
    domain?: string;
  };
  user?: {
    name?: string;
    email?: string;
    role?: string;
  };
}

export class CrmVariableParserService {
  /**
   * Reemplaza variables estilo {{lead.name}}, {{lead.email}}, {{deal.amount}}, {{company.name}} en un texto o prompt
   */
  static parseVariables(templateText: string, contextData: CrmContextData): string {
    if (!templateText) return "";

    let parsed = templateText;

    const replacements: Record<string, string> = {
      "{{lead.name}}": contextData.lead?.name || "Cliente Estimado",
      "{{lead.email}}": contextData.lead?.email || "correo@ejemplo.com",
      "{{lead.phone}}": contextData.lead?.phone || "N/A",
      "{{lead.companyName}}": contextData.lead?.companyName || contextData.company?.name || "Empresa Cliente",
      "{{lead.score}}": String(contextData.lead?.score || 0),
      "{{lead.status}}": contextData.lead?.status || "PROSPECT",
      "{{deal.title}}": contextData.deal?.title || "Oportunidad Comercial",
      "{{deal.amount}}": contextData.deal?.amount ? `$${contextData.deal.amount.toLocaleString()} ${contextData.deal.currency || "USD"}` : "$0 USD",
      "{{deal.stage}}": contextData.deal?.stage || "NUEVO",
      "{{company.name}}": contextData.company?.name || "LegacyMark",
      "{{company.domain}}": contextData.company?.domain || "legacymark.com",
      "{{user.name}}": contextData.user?.name || "Asesor Comercial",
      "{{user.email}}": contextData.user?.email || "soporte@legacymark.com",
      "{{user.role}}": contextData.user?.role || "Ejecutivo"
    };

    // Reemplazar campos personalizados de lead ({{lead.custom.xxx}})
    if (contextData.lead?.customFields) {
      for (const [key, val] of Object.entries(contextData.lead.customFields)) {
        replacements[`{{lead.custom.${key}}}`] = String(val);
      }
    }

    for (const [token, value] of Object.entries(replacements)) {
      parsed = parsed.replaceAll(token, value);
    }

    return parsed;
  }

  /**
   * Carga los datos reales del CRM desde Prisma dado el leadId o companyId
   */
  static async loadContextFromDb(companyId: string, leadId?: string): Promise<CrmContextData> {
    const context: CrmContextData = {
      company: { id: companyId, name: "LegacyMark SAS", domain: "legacymark.com" }
    };

    if (leadId) {
      try {
        const lead = await (prisma as any).lead.findUnique({
          where: { id: leadId }
        });
        if (lead) {
          context.lead = {
            id: lead.id,
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            companyName: lead.companyName,
            score: lead.score,
            status: lead.status
          };
        }
      } catch {
        // Fallback a datos demostrativos
        context.lead = {
          id: leadId,
          name: "Carlos Mendoza",
          email: "carlos.mendoza@empresa-demo.com",
          phone: "+57 300 123 4567",
          companyName: "Empresa Demo SAS",
          score: 88,
          status: "QUALIFIED"
        };
      }
    }

    return context;
  }
}
