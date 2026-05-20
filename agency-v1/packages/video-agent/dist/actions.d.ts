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
import { CoordinatorInput, AgentCoordinator } from '../src/agents/coordinator';
/**
 * Crea un coordinator con la API key proporcionada
 * La app principal es responsable de obtener la API key desde DB o env vars
 */
export declare function createVideoCoordinator(companyId: string, apiKey: string): AgentCoordinator;
/**
 * Ejecuta el workflow completo de edición
 * Retorna el resultado sin persistir - la app principal debe guardar
 */
export declare function runFullEditWorkflow(companyId: string, apiKey: string, input: CoordinatorInput): Promise<{
    success: boolean;
    result?: any;
    error?: string;
}>;
/**
 * Procesa un comando de usuario
 */
export declare function runAgentCommand(companyId: string, apiKey: string, projectId: string, command: string): Promise<{
    success: boolean;
    agent?: string;
    result?: any;
    error?: string;
}>;
/**
 * Ejecuta un agente específico
 * Nota: Por ahora delega al workflow completo. En futuro será posible ejecutar agentes individuales.
 */
export declare function runSpecificAgent(companyId: string, apiKey: string, agentName: 'logos' | 'croma' | 'phonos' | 'graphos', input: any): Promise<{
    success: boolean;
    result?: any;
    error?: string;
}>;
/**
 * Genera versiones alternativas del video
 * Por ahora retorna placeholder - la implementación completa vendrá después
 */
export declare function generateVideoVariations(companyId: string, apiKey: string, baseTimeline: any, style: string): Promise<{
    success: boolean;
    versions?: any[];
    error?: string;
}>;
declare const _default: {
    createVideoCoordinator: typeof createVideoCoordinator;
    runFullEditWorkflow: typeof runFullEditWorkflow;
    runAgentCommand: typeof runAgentCommand;
    runSpecificAgent: typeof runSpecificAgent;
    generateVideoVariations: typeof generateVideoVariations;
};
export default _default;
