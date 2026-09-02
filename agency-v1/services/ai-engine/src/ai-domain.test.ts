/**
 * AI Engine Domain Unit Tests
 * ─────────────────────────────────────────────────────────────────────────────
 * Tests:
 *  - CRM variable substitution in prompts
 *  - Style filter removing robotic AI mimicry
 *  - Frustration keyword detection for human escalation
 *  - Guardrail clamping logic
 */
import { describe, it, expect } from "vitest";

describe("AI Engine Domain Tests", () => {
  describe("CRM Variable Injection", () => {
    function injectCRMVariables(prompt: string, contactData: Record<string, any>): string {
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

    it("replaces customer and company tokens with actual contact values", () => {
      const template = "Hola {{contact.first_name}}, bienvenido a {{company.name}}. Tu cotización es de {{deal.value}}.";
      const contact = { firstName: "Carlos", companyName: "LegacyMark", dealValue: "15,000" };
      const output = injectCRMVariables(template, contact);

      expect(output).toBe("Hola Carlos, bienvenido a LegacyMark. Tu cotización es de $15,000.");
    });

    it("falls back to default values when contact data is missing", () => {
      const template = "Estimado {{contact.first_name}}, gracias por contactar a {{company.name}}.";
      const output = injectCRMVariables(template, {});

      expect(output).toBe("Estimado cliente, gracias por contactar a nuestra empresa.");
    });
  });

  describe("Style Filter (Human Mimicry)", () => {
    function applyStyleFilter(text: string): string {
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

    it("strips robotic opening disclaimers", () => {
      const roboticMsg = "Como inteligencia artificial, puedo ayudarte a calcular el ROI de tu campaña.";
      expect(applyStyleFilter(roboticMsg)).toBe("puedo ayudarte a calcular el ROI de tu campaña.");
    });

    it("preserves natural conversational openings", () => {
      const naturalMsg = "Con gusto te ayudo a revisar los detalles de la factura #1045.";
      expect(applyStyleFilter(naturalMsg)).toBe(naturalMsg);
    });
  });

  describe("Frustration & Human Escalation Detection", () => {
    const FRUSTRATION_KEYWORDS = [
      "hablar con humano", "hablar con una persona", "hablar con un asesor", "quiero un asesor", "asesor",
      "gerente", "esto es inaceptable", "muy mal servicio", "no funciona", "no me ayudas",
      "voy a cancelar", "cancelar suscripción", "quiero un reembolso", "terrible",
      "escalar", "supervisor", "speak to human", "real person",
    ];

    function isEscalationNeeded(message: string): boolean {
      const lower = message.toLowerCase();
      return FRUSTRATION_KEYWORDS.some((kw) => lower.includes(kw));
    }

    it("detects requests to speak with human agents", () => {
      expect(isEscalationNeeded("Por favor quiero hablar con un asesor ahora mismo")).toBe(true);
      expect(isEscalationNeeded("Esto es inaceptable, exijo hablar con una persona")).toBe(true);
      expect(isEscalationNeeded("I want to speak to human")).toBe(true);
    });

    it("allows standard inquiries to proceed to the AI agent", () => {
      expect(isEscalationNeeded("¿Cuáles son los horarios de atención?")).toBe(false);
      expect(isEscalationNeeded("Deseo agendar una demo para el próximo martes")).toBe(false);
    });
  });

  describe("Guardrail Clamping", () => {
    function clampTemperature(temp: number, enforceClamp: boolean): number {
      if (!enforceClamp) return temp;
      return Math.min(0.5, Math.max(0.2, temp));
    }

    it("clamps temperature between 0.2 and 0.5 when enforceClamp is active", () => {
      expect(clampTemperature(0.9, true)).toBe(0.5);
      expect(clampTemperature(0.05, true)).toBe(0.2);
      expect(clampTemperature(0.35, true)).toBe(0.35);
    });

    it("preserves original temperature when enforceClamp is false", () => {
      expect(clampTemperature(0.85, false)).toBe(0.85);
    });
  });
});
