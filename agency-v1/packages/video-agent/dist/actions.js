'use server';
/**
 * Video Agent Core Actions - Lógica pura del coordinador
 *
 * Este archivo NO tiene dependencias de base de datos.
 * La app principal (apps/web) debe usar este módulo para la lógica de coordinación
 * y manejar la persistencia por separado.
 *
 * Uso desde apps/web:
 *   import { createCoordinator } from '@agency/video-agent';
 *   // Tu código de persistencia con prisma
 *   // Luego llamas a las funciones del coordinator
 */
import { createCoordinator } from '../src/agents/coordinator';
/**
 * Crea un coordinator con la API key proporcionada
 * La app principal es responsable de obtener la API key desde DB o env vars
 */
export function createVideoCoordinator(companyId, apiKey) {
    return createCoordinator(companyId, apiKey);
}
/**
 * Ejecuta el workflow completo de edición
 * Retorna el resultado sin persistir - la app principal debe guardar
 */
export async function runFullEditWorkflow(companyId, apiKey, input) {
    try {
        const coordinator = createCoordinator(companyId, apiKey);
        const result = await coordinator.executeFullWorkflow(input);
        return { success: true, result: result };
    }
    catch (error) {
        console.error('Video workflow error:', error);
        return { success: false, error: error.message };
    }
}
/**
 * Procesa un comando de usuario
 */
export async function runAgentCommand(companyId, apiKey, projectId, command) {
    try {
        const coordinator = createCoordinator(companyId, apiKey);
        const result = await coordinator.processCommand(projectId, command);
        return {
            success: result.success,
            agent: result.agent,
            result: result.result
        };
    }
    catch (error) {
        return { success: false, error: error.message };
    }
}
/**
 * Ejecuta un agente específico
 * Nota: Por ahora delega al workflow completo. En futuro será posible ejecutar agentes individuales.
 */
export async function runSpecificAgent(companyId, apiKey, agentName, input) {
    try {
        // Por ahora, ejecutamos el workflow completo y retornamos el resultado del agente específico
        const coordinator = createCoordinator(companyId, apiKey);
        const result = await coordinator.executeFullWorkflow({
            projectId: input.projectId || 'temp',
            companyId,
            clips: input.clips || [],
            outputFormat: input.outputFormat || '9:16',
            platform: input.platform || 'reels',
            style: input.style || 'cinematic',
            duration: input.duration || 20,
            hookDuration: input.hookDuration || 3
        });
        return { success: true, result: { agent: agentName, output: result } };
    }
    catch (error) {
        return { success: false, error: error.message };
    }
}
/**
 * Genera versiones alternativas del video
 * Por ahora retorna placeholder - la implementación completa vendrá después
 */
export async function generateVideoVariations(companyId, apiKey, baseTimeline, style) {
    try {
        // Por ahora retornamos placeholder
        // La implementación completa usará el coordinator
        return {
            success: true,
            versions: [
                { version: 'A', name: 'Variación A', description: `Estilo ${style}` },
                { version: 'B', name: 'Variación B', description: `Estilo ${style} alternativo` },
                { version: 'C', name: 'Variación C', description: `Estilo ${style} premium` }
            ]
        };
    }
    catch (error) {
        return { success: false, error: error.message };
    }
}
export default {
    createVideoCoordinator,
    runFullEditWorkflow,
    runAgentCommand,
    runSpecificAgent,
    generateVideoVariations
};
