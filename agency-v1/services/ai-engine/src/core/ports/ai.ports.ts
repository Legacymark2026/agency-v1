/**
 * AI Engine — Hexagonal Ports (Inbound & Outbound Interfaces)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { AgentResponseDomain } from "../domain/ai.domain";

export interface ExecuteAgentDTO {
  agentId: string;
  companyId: string;
  userMessage: string;
  conversationId?: string;
  contactData?: Record<string, any>;
  promptTemplate?: string;
}

// Inbound Port: Primary Use Cases
export interface IAiEngineUseCases {
  execute(dto: ExecuteAgentDTO): Promise<AgentResponseDomain>;
  injectVariables(prompt: string, contactData: Record<string, any>): string;
}

// Outbound Port: LLM Provider (Cascade with Fallbacks)
export interface ILlmProviderPort {
  generate(systemPrompt: string, userMessage: string, history?: Array<{ role: string; content: string }>): Promise<{ text: string; tokensUsed: number }>;
}

// Outbound Port: Agent Memory
export interface IAgentMemoryPort {
  getRecentContext(conversationId: string, limit?: number): Promise<Array<{ role: string; content: string }>>;
  saveTurn(conversationId: string, userMsg: string, aiMsg: string): Promise<void>;
}

// Outbound Port: Event Publisher
export interface IAiEventPublisherPort {
  publishAiEvent(topic: string, event: Record<string, any>): Promise<void>;
}
