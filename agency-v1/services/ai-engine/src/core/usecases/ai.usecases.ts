/**
 * AI Engine — Pure Hexagonal Use Cases Orchestration
 * ─────────────────────────────────────────────────────────────────────────────
 */
import {
  IAiEngineUseCases,
  ILlmProviderPort,
  IAgentMemoryPort,
  IAiEventPublisherPort,
  ExecuteAgentDTO,
} from "../ports/ai.ports";
import {
  AgentResponseDomain,
  injectCRMVariables,
  applyStyleFilter,
  detectEscalationKeywords,
} from "../domain/ai.domain";

export class AiEngineUseCases implements IAiEngineUseCases {
  constructor(
    private readonly llmPort: ILlmProviderPort,
    private readonly memoryPort: IAgentMemoryPort,
    private readonly eventPublisher: IAiEventPublisherPort
  ) {}

  public injectVariables(prompt: string, contactData: Record<string, any>): string {
    return injectCRMVariables(prompt, contactData);
  }

  public async execute(dto: ExecuteAgentDTO): Promise<AgentResponseDomain> {
    const startTime = Date.now();
    const conversationId = dto.conversationId || "conv_" + Math.random().toString(36).substring(2, 9);

    // 1. Check for human escalation
    const escalation = detectEscalationKeywords(dto.userMessage);
    if (escalation.shouldEscalate) {
      const resp = new AgentResponseDomain(
        "resp_" + Math.random().toString(36).substring(2, 9),
        conversationId,
        dto.agentId,
        "Entendido. Te transferiré con uno de nuestros asesores humanos de inmediato.",
        true,
        0,
        Date.now() - startTime
      );

      await this.eventPublisher.publishAiEvent("ai.agent.escalated", {
        conversationId,
        agentId: dto.agentId,
        reason: escalation.matchedKeyword,
      });

      return resp;
    }

    // 2. Prepare prompt with CRM variables
    let systemPrompt = dto.promptTemplate || "Eres un asesor profesional experto.";
    if (dto.contactData) {
      systemPrompt = injectCRMVariables(systemPrompt, dto.contactData);
    }

    // 3. Retrieve conversation memory
    const history = await this.memoryPort.getRecentContext(conversationId, 6);

    // 4. Invoke LLM provider
    const llmResult = await this.llmPort.generate(systemPrompt, dto.userMessage, history);
    const filteredText = applyStyleFilter(llmResult.text);

    // 5. Save memory turn
    await this.memoryPort.saveTurn(conversationId, dto.userMessage, filteredText);

    const domainResponse = new AgentResponseDomain(
      "resp_" + Math.random().toString(36).substring(2, 9),
      conversationId,
      dto.agentId,
      filteredText,
      false,
      llmResult.tokensUsed,
      Date.now() - startTime
    );

    await this.eventPublisher.publishAiEvent("ai.agent.responded", {
      conversationId,
      agentId: dto.agentId,
      tokensUsed: llmResult.tokensUsed,
    });

    return domainResponse;
  }
}
