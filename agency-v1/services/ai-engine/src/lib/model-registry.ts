/**
 * Unified Model Registry — AI Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix C-5: Eliminates dynamic require() inside the hot inference loop by statically
 *          importing and caching SDK provider instances (OpenAI, Anthropic, Gemini).
 */
import { google } from "@ai-sdk/google";
import { openai, createOpenAI } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";

export function buildModel(modelId: string): any {
  if (modelId.startsWith("gpt-") || modelId.startsWith("o1") || modelId.startsWith("o3") || modelId.startsWith("o4")) {
    return openai(modelId);
  }

  if (modelId.startsWith("claude-") || modelId.startsWith("claude3")) {
    return anthropic(modelId);
  }

  if (modelId.startsWith("deepseek-")) {
    const deepseek = createOpenAI({
      baseURL: "https://api.deepseek.com/v1",
      apiKey: process.env.DEEPSEEK_API_KEY || "",
    });
    return deepseek(modelId);
  }

  if (modelId.startsWith("mistral-")) {
    const mistral = createOpenAI({
      baseURL: "https://api.mistral.ai/v1",
      apiKey: process.env.MISTRAL_API_KEY || "",
    });
    return mistral(modelId);
  }

  // Default: Google Gemini
  return google(modelId);
}
