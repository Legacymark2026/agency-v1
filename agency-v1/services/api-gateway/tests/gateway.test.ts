import { describe, it, expect } from "vitest";
import { GatewayService } from "../src/services/gateway.service";

describe("GatewayService Unit Tests", () => {
  it("debe resolver URL del servicio auth correctamente", () => {
    const url = GatewayService.resolveServiceUrl("auth");
    expect(typeof url).toBe("string");
    expect(url.length).toBeGreaterThan(0);
  });

  it("debe devolver string vacío para servicio desconocido", () => {
    const url = GatewayService.resolveServiceUrl("servicio-inexistente");
    expect(url).toBe("");
  });

  it("debe tener método verifyToken definido", () => {
    expect(typeof GatewayService.verifyToken).toBe("function");
  });
});
