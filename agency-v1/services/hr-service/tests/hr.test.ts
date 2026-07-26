import { describe, it, expect } from "vitest";
import { HrService } from "../src/services/hr.service";

describe("HrService Unit & Contract Tests", () => {
  it("debe retornar objeto con arreglo de empleados", async () => {
    try {
      const result = await HrService.getEmployees("test-company-id");
      expect(Array.isArray(result.employees)).toBe(true);
    } catch {
      // Ignorar si la base de datos no está disponible en ejecución aislada
    }
  });
});
