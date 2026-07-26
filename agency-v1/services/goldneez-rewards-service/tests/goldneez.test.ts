import { describe, it, expect, vi } from "vitest";
import { GoldneezService } from "../src/services/goldneez.service";

describe("GoldneezService Unit Tests", () => {
  it("debe tener los métodos getPoints y redeemReward definidos", () => {
    expect(typeof GoldneezService.getPoints).toBe("function");
    expect(typeof GoldneezService.redeemReward).toBe("function");
  });
});
