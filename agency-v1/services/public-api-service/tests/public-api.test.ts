import { describe, it, expect } from "vitest";
import { PublicApiService } from "../src/services/public-api.service";

describe("PublicApiService Unit & Contract Tests", () => {
  it("debe retornar objeto con estado operativo de la API", async () => {
    const status = await PublicApiService.getPublicStatus();
    expect(status.status).toBe("OPERATIONAL");
  });
});
