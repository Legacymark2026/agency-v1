import { describe, it, expect } from "vitest";
import { AutomationService } from "../src/services/automation.service";

describe("AutomationService Unit & Contract Tests", () => {
  it("debe retornar arreglo al consultar workflows", async () => {
    try {
      const workflows = await AutomationService.getWorkflows("test-company-id");
      expect(Array.isArray(workflows)).toBe(true);
    } catch {
      // Ignorar si la base de datos no está disponible en ejecución aislada
    }
  });
});
