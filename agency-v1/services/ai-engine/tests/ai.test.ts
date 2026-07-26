import { describe, it, expect } from "vitest";
import { AiService } from "../src/services/ai.service";

describe("AiService Unit & Contract Tests", () => {
  it("debe ejecutar respuesta de agente de IA correctamente", async () => {
    const result = await AiService.runAgent({
      agentId: "test-agent",
      companyId: "test-company",
      userMessage: "Hola IA"
    });
    expect(result.success).toBe(true);
    expect(result.response).toContain("Hola IA");
  });
});
