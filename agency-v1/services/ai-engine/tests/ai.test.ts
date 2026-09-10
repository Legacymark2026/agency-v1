import { describe, it, expect } from "vitest";
import { AiEngineUseCases } from "../src/core/usecases/ai.usecases";
import { ILlmProviderPort, IAgentMemoryPort, IAiEventPublisherPort } from "../src/core/ports/ai.ports";

describe("AiEngine Hexagonal Architecture 5.0 (Inbound & Outbound Ports)", () => {
  it("debe ejecutar respuesta de agente de IA correctamente con puertos desacoplados", async () => {
    const memorySaved: Array<{ user: string; ai: string }> = [];
    const publishedEvents: Array<{ topic: string; event: any }> = [];

    const mockLlm: ILlmProviderPort = {
      generate: async (sys, user) => ({
        text: `Hola IA! Respuesta generada para: ${user}`,
        tokensUsed: 25,
      }),
    };

    const mockMemory: IAgentMemoryPort = {
      getRecentContext: async () => [],
      saveTurn: async (convId, user, ai) => {
        memorySaved.push({ user, ai });
      },
    };

    const mockPublisher: IAiEventPublisherPort = {
      publishAiEvent: async (topic, event) => {
        publishedEvents.push({ topic, event });
      },
    };

    const useCases = new AiEngineUseCases(mockLlm, mockMemory, mockPublisher);

    const result = await useCases.execute({
      agentId: "test-agent",
      companyId: "test-company",
      userMessage: "Hola IA",
      contactData: { firstName: "Carlos" },
    });

    expect(result.id).toBeDefined();
    expect(result.response).toContain("Hola IA");
    expect(result.escalatedToHuman).toBe(false);
    expect(memorySaved.length).toBe(1);
    expect(publishedEvents.some((e) => e.topic === "ai.agent.responded")).toBe(true);
  });

  it("debe escalar a un humano si detecta palabras clave de frustración o demanda", async () => {
    const publishedEvents: Array<{ topic: string; event: any }> = [];

    const mockLlm: ILlmProviderPort = {
      generate: async () => ({ text: "ok", tokensUsed: 5 }),
    };
    const mockMemory: IAgentMemoryPort = {
      getRecentContext: async () => [],
      saveTurn: async () => {},
    };
    const mockPublisher: IAiEventPublisherPort = {
      publishAiEvent: async (topic, event) => {
        publishedEvents.push({ topic, event });
      },
    };

    const useCases = new AiEngineUseCases(mockLlm, mockMemory, mockPublisher);

    const result = await useCases.execute({
      agentId: "support-agent",
      companyId: "test-company",
      userMessage: "Quiero hablar con un humano por favor",
    });

    expect(result.escalatedToHuman).toBe(true);
    expect(result.response).toContain("asesores humanos");
    expect(publishedEvents.some((e) => e.topic === "ai.agent.escalated")).toBe(true);
  });
});

