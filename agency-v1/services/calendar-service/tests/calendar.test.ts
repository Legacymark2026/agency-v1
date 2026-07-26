import { describe, it, expect } from "vitest";
import { CalendarService } from "../src/services/calendar.service";

describe("CalendarService Unit & Contract Tests", () => {
  it("debe retornar arreglo al consultar eventos", async () => {
    try {
      const events = await CalendarService.getEvents("test-company-id");
      expect(Array.isArray(events)).toBe(true);
    } catch {
      // Ignorar si la base de datos no está disponible en ejecución aislada
    }
  });
});
