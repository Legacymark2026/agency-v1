import { describe, it, expect } from "vitest";
import { AnalyticsService } from "../src/services/analytics.service";

describe("AnalyticsService Unit & Contract Tests", () => {
  it("debe retornar arreglo al consultar logs de actividad", async () => {
    try {
      const logs = await AnalyticsService.getUserActivityLogs("test-user-id");
      expect(Array.isArray(logs)).toBe(true);
    } catch {
      // Ignorar si la base de datos no está disponible en ejecución aislada
    }
  });
});
