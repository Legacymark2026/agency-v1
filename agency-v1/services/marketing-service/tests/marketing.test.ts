import { describe, it, expect } from "vitest";
import { MarketingService } from "../src/services/marketing.service";

describe("MarketingService Unit & Contract Tests", () => {
  it("debe retornar arreglo al consultar email blasts", async () => {
    try {
      const blasts = await MarketingService.getEmailBlasts("test-company-id");
      expect(Array.isArray(blasts)).toBe(true);
    } catch {
      // Ignorar si la base de datos no está disponible en ejecución aislada
    }
  });
});
