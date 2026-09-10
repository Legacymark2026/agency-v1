/**
 * AI Engine — Pure Domain Entities & Intelligence Rules
 * ─────────────────────────────────────────────────────────────────────────────
 * Zero external framework dependencies.
 */

export function injectCRMVariables(prompt: string, contactData: Record<string, any>): string {
  const varMap: Record<string, string> = {
    "{{contact.first_name}}": contactData?.firstName || contactData?.name?.split(" ")[0] || "cliente",
    "{{contact.last_name}}": contactData?.lastName || "",
    "{{contact.email}}": contactData?.email || "",
    "{{deal.value}}": contactData?.dealValue ? `$${contactData.dealValue}` : "",
    "{{deal.stage}}": contactData?.dealStage || "",
    "{{company.name}}": contactData?.companyName || "nuestra empresa",
  };
  let result = prompt;
  for (const [token, value] of Object.entries(varMap)) {
    result = result.replaceAll(token, value);
  }
  return result;
}

export function applyStyleFilter(text: string): string {
  const roboticPhrases = [
    /^Como (IA|inteligencia artificial|asistente virtual),?\s*/i,
    /^Entiendo que (tu|su) pregunta/i,
    /^¡Claro! A continuación te presento/i,
  ];
  let result = text;
  for (const re of roboticPhrases) {
    result = result.replace(re, "");
  }
  return result.trim();
}

export function detectEscalationKeywords(message: string): { shouldEscalate: boolean; matchedKeyword?: string } {
  const keywords = ["hablar con un humano", "humano", "asesor", "representante", "demanda", "abogado", "gerente", "estafa"];
  const lower = message.toLowerCase();
  for (const kw of keywords) {
    if (lower.includes(kw)) {
      return { shouldEscalate: true, matchedKeyword: kw };
    }
  }
  return { shouldEscalate: false };
}

export class AgentResponseDomain {
  constructor(
    public readonly id: string,
    public readonly conversationId: string,
    public readonly agentId: string,
    public readonly response: string,
    public readonly escalatedToHuman: boolean = false,
    public readonly tokensUsed: number = 0,
    public readonly latencyMs: number = 0,
    public readonly createdAt: Date = new Date()
  ) {}
}
