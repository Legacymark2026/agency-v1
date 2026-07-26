import { describe, it, expect } from "vitest";
import { AuthService } from "../src/services/auth.service";

describe("AuthService Unit & Contract Tests", () => {
  it("debe requerir un email y contraseña válidos", async () => {
    await expect(
      AuthService.login({ email: "invalid@email.com", password: "wrongpassword" }, null)
    ).rejects.toThrow("INVALID_CREDENTIALS");
  });
});
