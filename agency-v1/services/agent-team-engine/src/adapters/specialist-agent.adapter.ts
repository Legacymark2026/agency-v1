/**
 * Agent Team Engine — Specialist Agent Adapter
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { ISpecialistAgentPort } from "../core/ports/agent-team.ports";
import { SpecialistRole } from "../core/domain/agent-team.domain";

export class SpecialistAgentAdapter implements ISpecialistAgentPort {
  public async executeTask(role: SpecialistRole, instruction: string): Promise<{ output: string; confidence: number }> {
    return {
      output: `Resultado de especialista ${role} para instrucción: ${instruction}`,
      confidence: 0.95,
    };
  }
}
