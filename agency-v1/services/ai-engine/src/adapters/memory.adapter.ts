/**
 * AI Engine — Memory Infrastructure Adapter
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { IAgentMemoryPort } from "../core/ports/ai.ports";

export class AgentMemoryAdapter implements IAgentMemoryPort {
  public async getRecentContext(conversationId: string, limit = 6): Promise<Array<{ role: string; content: string }>> {
    return [];
  }
  public async saveTurn(conversationId: string, userMsg: string, aiMsg: string): Promise<void> {}
}
