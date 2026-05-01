/**
 * lib/agent-tools.ts — Unified Tool Bridge  (v2)
 * ─────────────────────────────────────────────────────────────────────────────
 * SINGLE SOURCE OF TRUTH para herramientas del Agent Runner.
 *
 * Actúa como bridge entre el Agent Runner (Gemini function-calling)
 * y la capa de ejecución real en `lib/services/ai-tools.ts`.
 *
 * ANTES: 3 stubs desincronizados con ejecución simulada.
 * AHORA: 10 tools completas con ejecución real en DB/CRM.
 */

import { FunctionDeclaration, FunctionCall, FunctionResponsePart } from "@google/generative-ai";
import { AIAgentTools, executeAgentTool } from "@/lib/services/ai-tools";

// ─────────────────────────────────────────────────────────────────────────────
// Re-export the canonical tool declarations map
// ─────────────────────────────────────────────────────────────────────────────
export { AIAgentTools as AVAILABLE_TOOLS };

// ─────────────────────────────────────────────────────────────────────────────
// getToolDeclarations
// Filtra las declaraciones habilitadas para un agente específico.
// Called by agent-runner.ts to build the `tools` array for the Gemini SDK.
// ─────────────────────────────────────────────────────────────────────────────
export function getToolDeclarations(enabledToolNames: string[]): FunctionDeclaration[] {
    return enabledToolNames
        .filter((name) => AIAgentTools[name])
        .map((name) => AIAgentTools[name] as FunctionDeclaration);
}

// ─────────────────────────────────────────────────────────────────────────────
// executeTools
// Adapter for the multi-turn tool-use loop in agent-runner.ts.
//
// Input:  Array<{ name, args }> (Gemini functionCalls format)
// Output: Array<{ functionResponse: { name, response } }> (Gemini expected format)
// ─────────────────────────────────────────────────────────────────────────────
export async function executeTools(
    calls: FunctionCall[],
    companyId: string,
    contactData: Record<string, unknown>
): Promise<FunctionResponsePart[]> {
    const responses: FunctionResponsePart[] = [];

    for (const call of calls) {
        let result: unknown;
        try {
            // Enrich args with contact context so tools like qualify_and_score_lead
            // can resolve the lead without the agent needing to pass the email explicitly.
            const callArgs = call.args as Record<string, unknown>;
            const enrichedArgs = {
                ...callArgs,
                _contactEmail:
                    (callArgs._contactEmail as string | undefined) ??
                    (contactData?.email as string | undefined),
                _contactName:
                    (callArgs._contactName as string | undefined) ??
                    (contactData?.firstName as string | undefined),
            };
            result = await executeAgentTool(companyId, call.name, enrichedArgs);
            
            // Ensure the result is an object to satisfy Gemini's FunctionResponsePart
            if (typeof result !== "object" || result === null) {
                result = { value: result };
            }
        } catch (err: unknown) {
            const error = err instanceof Error ? err.message : String(err);
            result = { success: false, error: `Tool execution failed: ${error}` };
        }

        responses.push({
            functionResponse: {
                name: call.name,
                response: result as object,
            },
        });
    }

    return responses;
}
