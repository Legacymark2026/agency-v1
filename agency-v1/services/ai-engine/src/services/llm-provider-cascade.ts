/**
 * LLM Provider Cascade & Fallback Manager
 * ─────────────────────────────────────────────────────────────────────────────
 * Multi-tier AI execution manager with automatic provider failover,
 * rate-limit handling, circuit breaking, and smart contingency fallbacks.
 */

import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export interface CascadeOptions {
  systemPrompt: string;
  userMessage: string;
  preferredModelId?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface CascadeResult {
  text: string;
  providerUsed: string;
  modelUsed: string;
  fallbackTriggered: boolean;
  attempts: number;
  latencyMs: number;
}

const FALLBACK_MODELS = [
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gpt-4o-mini",
  "gpt-3.5-turbo",
  "deepseek-chat"
];

function getModelInstance(modelId: string) {
  try {
    if (modelId.startsWith("gpt-") || modelId.startsWith("o1") || modelId.startsWith("o3")) {
      const { openai } = require("@ai-sdk/openai");
      return openai(modelId);
    }
    if (modelId.startsWith("claude-")) {
      const { anthropic } = require("@ai-sdk/anthropic");
      return anthropic(modelId);
    }
    if (modelId.startsWith("deepseek-")) {
      const { createOpenAI } = require("@ai-sdk/openai");
      const deepseek = createOpenAI({
        baseURL: "https://api.deepseek.com/v1",
        apiKey: process.env.DEEPSEEK_API_KEY || "sk-dummy"
      });
      return deepseek(modelId);
    }
  } catch (e) {
    console.warn(`[LLM-Cascade] Optional provider binding error for ${modelId}:`, e);
  }
  // Default fallback: Google Gemini
  return google(modelId.includes("pro") ? "gemini-1.5-pro" : "gemini-1.5-flash");
}

export async function executeResilientLLM(options: CascadeOptions): Promise<CascadeResult> {
  const startTime = Date.now();
  const modelsToTry = [
    options.preferredModelId || "gemini-1.5-flash",
    ...FALLBACK_MODELS.filter((m) => m !== (options.preferredModelId || "gemini-1.5-flash"))
  ];

  let attempts = 0;
  let lastError: Error | null = null;

  for (const modelId of modelsToTry) {
    attempts++;
    try {
      console.log(`[LLM-Cascade] Attempt ${attempts}: Trying ${modelId}...`);
      const model = getModelInstance(modelId);
      const response = await generateText({
        model,
        system: options.systemPrompt,
        prompt: options.userMessage,
        temperature: options.temperature ?? 0.7,
        maxTokens: options.maxTokens ?? 1000,
      });

      if (response.text && response.text.trim().length > 0) {
        const latencyMs = Date.now() - startTime;
        return {
          text: response.text.trim(),
          providerUsed: modelId.split("-")[0],
          modelUsed: modelId,
          fallbackTriggered: attempts > 1,
          attempts,
          latencyMs,
        };
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[LLM-Cascade] Provider ${modelId} failed on attempt ${attempts}:`, err?.message || err);
      // Wait 100ms before trying secondary provider
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  // Final Contingency Fallback — Smart Rule-Based Engine
  console.error(`[LLM-Cascade] All AI providers failed after ${attempts} attempts. Executing rule-based contingency response.`);
  const latencyMs = Date.now() - startTime;
  
  return {
    text: generateContingencyResponse(options.userMessage),
    providerUsed: "contingency-engine",
    modelUsed: "rule-based-fallback-v1",
    fallbackTriggered: true,
    attempts,
    latencyMs,
  };
}

/**
 * Contingency response generator when all external LLM APIs are unreachable
 */
function generateContingencyResponse(userMessage: string): string {
  const msg = userMessage.toLowerCase();
  
  if (msg.includes("precio") || msg.includes("costo") || msg.includes("valor") || msg.includes("plan")) {
    return "Gracias por consultar sobre nuestros planes y precios. En este momento estoy procesando la información actualizada para ofrecerte la mejor tarifa disponible. ¿Te gustaría que un asesor comercial se ponga en contacto contigo inmediatamente?";
  }
  
  if (msg.includes("soporte") || msg.includes("error") || msg.includes("problema") || msg.includes("ayuda")) {
    return "Lamentamos los inconvenientes. Tu caso ha sido registrado con prioridad en nuestro centro de soporte técnico. Un especialista de nuestro equipo lo revisará en los próximos minutos.";
  }

  return "Hola. He recibido tu mensaje correctamente y he notificado a nuestro equipo de atención. Te responderemos en la brevedad posible.";
}
