import { prisma } from "@/lib/prisma";
import { executeAgentTool } from "./ai-tools";

export interface SkillchainExecutionResult {
    success: boolean;
    executedTools: string[];
    finalOutput?: any;
    error?: string;
}

/**
 * 5x Skillchain Engine
 * Ejecuta una cadena secuencial de habilidades (herramientas) configuradas para un agente.
 * Diseñado para reducir la latencia de "ida y vuelta" con el LLM en flujos de trabajo repetitivos.
 */
export async function executeSkillChain(
    companyId: string,
    skillChainId: string,
    initialPayload: Record<string, any>,
    userContext: any
): Promise<SkillchainExecutionResult> {
    try {
        // 1. Obtener la configuración del Skillchain
        const chain = await prisma.agentSkillChain.findUnique({
            where: { id: skillChainId, companyId }
        });

        if (!chain) {
            return { success: false, executedTools: [], error: "SkillChain no encontrado" };
        }

        if (!chain.isActive) {
            return { success: false, executedTools: [], error: "El SkillChain está inactivo" };
        }

        const toolsSequence = Array.isArray(chain.tools) ? chain.tools : [];
        if (toolsSequence.length === 0) {
            return { success: false, executedTools: [], error: "El SkillChain no tiene herramientas configuradas" };
        }

        // Limitamos a 5x por seguridad y performance
        const maxTools = toolsSequence.slice(0, 5);

        let currentContext = { ...initialPayload };
        const executedTools: string[] = [];
        let lastOutput: any = null;

        // 2. Ejecutar la cadena secuencialmente
        for (const toolDef of maxTools) {
            const toolName = (toolDef as any).toolName;
            
            // Construimos los argumentos mapeando el contexto acumulado
            // En V1, asumimos que todas las llaves necesarias están en currentContext
            console.log(`[5x Skillchain] Ejecutando: ${toolName}`);
            
            const toolResult = await executeAgentTool(
                companyId,
                toolName,
                currentContext,
                userContext
            );

            executedTools.push(toolName);
            lastOutput = toolResult;

            // Acumulamos el output en el contexto para la siguiente herramienta
            if (typeof toolResult === "object" && toolResult !== null) {
                currentContext = { ...currentContext, ...toolResult };
            } else {
                currentContext = { ...currentContext, [`${toolName}_output`]: toolResult };
            }
        }

        return {
            success: true,
            executedTools,
            finalOutput: lastOutput
        };

    } catch (error: any) {
        console.error(`[5x Skillchain] Error ejecutando cadena ${skillChainId}:`, error);
        return {
            success: false,
            executedTools: [],
            error: error.message || "Error interno ejecutando el Skillchain"
        };
    }
}
