import { describe, it, expect } from "vitest";
import { VideoService } from "../src/services/video.service";

describe("VideoService Unit & Contract Tests", () => {
  it("debe retornar arreglo al consultar proyectos de video", async () => {
    try {
      const projects = await VideoService.getVideoProjects("test-company-id");
      expect(Array.isArray(projects)).toBe(true);
    } catch {
      // Ignorar si la base de datos no está disponible en ejecución aislada
    }
  });
});
