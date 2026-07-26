import { describe, it, expect } from "vitest";
import { AgentTeamService } from "../src/services/agent-team.service";

describe("AgentTeamService Unit Tests", () => {
  it("debe instanciar el servicio correctamente", () => {
    expect(AgentTeamService).toBeDefined();
    expect(typeof AgentTeamService.getTeams).toBe("function");
  });
});
