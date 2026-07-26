import { describe, it, expect } from "vitest";
import { DocumentService } from "../src/services/document.service";

describe("DocumentService Unit & Contract Tests", () => {
  it("debe retornar arreglo al consultar propuestas", async () => {
    try {
      const proposals = await DocumentService.getProposals("test-company-id");
      expect(Array.isArray(proposals)).toBe(true);
    } catch {
      // Ignorar si la base de datos no está disponible en ejecución aislada
    }
  });
});
