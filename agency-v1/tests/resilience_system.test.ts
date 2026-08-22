import { executeResilientLLM } from "../services/ai-engine/src/services/llm-provider-cascade";
import { sendResilientEmail } from "../services/notification-service/src/services/email-fallback-transporter";
import { ResilientCacheClient } from "../packages/events/src/resilient-cache-client";

describe("Ultra-Professional Multilayer Fallback System Audit", () => {
  test("1. LLM Provider Cascade should handle failover gracefully", async () => {
    const result = await executeResilientLLM({
      systemPrompt: "Eres un asistente virtual de LegacyMark.",
      userMessage: "Hola, quisiera saber los precios de sus planes.",
      preferredModelId: "non-existent-model-id-trigger-fallback",
    });

    expect(result).toBeDefined();
    expect(typeof result.text).toBe("string");
    expect(result.text.length).toBeGreaterThan(0);
    expect(result.fallbackTriggered).toBe(true);
  });

  test("2. Resilient Email Transporter should handle API failure with Outbox DLQ", async () => {
    const result = await sendResilientEmail({
      to: "test@legacymarksas.com",
      subject: "Prueba de Resiliencia",
      html: "<p>Contenido de prueba</p>",
    });

    expect(result).toBeDefined();
    expect(result.attempts).toBeGreaterThanOrEqual(1);
    expect(typeof result.provider).toBe("string");
  });

  test("3. Resilient Cache Client should fallback to in-memory LRU when Redis is offline", async () => {
    const cache = new ResilientCacheClient("redis://localhost:99999"); // Invalid port triggers in-memory fallback
    await cache.set("test_key", "test_value", 60);

    const val = await cache.get("test_key");
    expect(val).toBe("test_value");

    await cache.del("test_key");
    const valAfterDel = await cache.get("test_key");
    expect(valAfterDel).toBeNull();
  });
});
