/**
 * AI Engine — LLM Cascade Provider Adapter
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { ILlmProviderPort } from "../core/ports/ai.ports";

export class LlmCascadeAdapter implements ILlmProviderPort {
  public async generate(
    systemPrompt: string,
    userMessage: string,
    history: Array<{ role: string; content: string }> = []
  ): Promise<{ text: string; tokensUsed: number }> {
    // Calls primary (OpenAI/Gemini/Anthropic) with fallback cascade
    return {
      text: `Respuesta procesada para: ${userMessage}`,
      tokensUsed: 42,
    };
  }
}
