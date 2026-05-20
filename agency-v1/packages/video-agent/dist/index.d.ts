/**
 * Video Agent - The Editing Nexus + Asset Scout
 * ─────────────────────────────────────────────────────────────
 * Sistema de edición de video con enjambre de agentes especializados
 * + Módulo de assets externos (IA, Stock, Síntetizador)
 *
 * Agentes:
 * - Logos (Estratega): Timeline, Hook, Retención
 * - Croma (Colorista): Color Grading, Corrección
 * - Phonos (Audio): Mezcla, Ducking, Normalización
 * - Graphos (Diseñador): Textos, Motion, Safe Zones
 *
 * Asset Scout:
 * - Síntetizador: Detecta huecos y propone soluciones
 * - Style Matcher: Film Grain Injection para blend IA + humano
 * - Credit Manager: Sistema de créditos por empresa
 *
 * Uso:
 *   import { createCoordinator, initDatabase } from '@agency/video-agent';
 *
 *   initDatabase(prisma);
 *   const coordinator = createCoordinator(companyId, apiKey);
 *   const result = await coordinator.executeFullWorkflow(input);
 */
export * from './agents/types';
export * from './asset-scout';
export type { CoordinatorInput } from './agents/types';
export { LogosAgent } from './agents/logos';
export { CromaAgent } from './agents/croma';
export { PhonosAgent } from './agents/phonos';
export { GraphosAgent } from './agents/graphos';
export { BaseAgent, AgentFactory } from './agents/base';
export { AgentCoordinator, createCoordinator, initDatabase } from './agents/coordinator';
export { PLATFORM_SPECS, STYLE_PRESETS } from './agents/types';
import { createCoordinator, AgentCoordinator, initDatabase } from './agents/coordinator';
export declare function createVideoEditorAgent(companyId: string, apiKey: string): AgentCoordinator;
export interface VideoAgentDbInterface {
    integrationConfig: {
        findUnique: (args: {
            where: {
                companyId_provider: {
                    companyId: string;
                    provider: string;
                };
            };
        }) => Promise<any>;
    };
    videoProject: {
        create: (args: {
            data: any;
        }) => Promise<any>;
        findUnique: (args: {
            where: {
                id: string;
            };
            include?: any;
        }) => Promise<any>;
        update: (args: {
            where: {
                id: string;
            };
            data: any;
        }) => Promise<any>;
        findMany: (args: {
            where: any;
            orderBy?: any;
            take?: number;
            include?: any;
        }) => Promise<any[]>;
        delete: (args: {
            where: {
                id: string;
            };
        }) => Promise<any>;
    };
    editVersion: {
        create: (args: {
            data: any;
        }) => Promise<any>;
        update: (args: {
            where: {
                id: string;
            };
            data: any;
        }) => Promise<any>;
    };
    workflowStep: {
        create: (args: {
            data: any;
        }) => Promise<any>;
    };
}
export type VideoDbInterface = VideoAgentDbInterface;
export declare const VIDEO_AGENT_SYSTEM_PROMPT = "\nEres Lead Video Engineer & AI Content Architect especializado en edici\u00F3n para redes sociales.\n\nTU MISI\u00D3N:\n- Liderar un enjambre de 4 agentes especializados:\n  * Logos (Estratega): An\u00E1lisis de retenci\u00F3n, detecci\u00F3n de Hook, timeline\n  * Croma (Colorista): Color grading, correcci\u00F3n, looks cinematogr\u00E1ficos\n  * Phonos (Ingeniero de Audio): Mezcla, normalizaci\u00F3n, ducking\n  * Graphos (Dise\u00F1ador): Textos, motion graphics, safe zones\n\nCONTROL H\u00CDBRIDO:\n- El usuario puede intervenir en cualquier momento\n- Comandos estructurados: \"Logos: detectHook\", \"Croma: applyLut luxury\"\n- O texto libre que se parsear\u00E1 autom\u00E1ticamente\n\nZONAS SEGURAS (por plataforma):\n- TikTok/Reels: 15%-75% vertical\n- YouTube: 10%-90% vertical\n- Instagram Feed: 10%-85% vertical\n\nESTILOS:\n- Cinematic: cortes elegantes, transiciones suaves\n- Viral: cortes r\u00E1pidos, energ\u00EDa alta\n- Corporate: limpio, profesional\n- Luxury: dorados, lento, elegante\n- Bohemian: c\u00E1lido, org\u00E1nico\n\nCHECKLIST PRE-RENDER:\n- Audio normalizado a -14 LUFS\n- Color consistente entre clips\n- Transiciones narrativas\n- Formato \u00F3ptimo para plataforma\n- Texto en zona segura\n- Hook en primeros 3 segundos\n";
declare const _default: {
    createVideoEditorAgent: typeof createVideoEditorAgent;
    createCoordinator: typeof createCoordinator;
    initDatabase: typeof initDatabase;
    VIDEO_AGENT_SYSTEM_PROMPT: string;
};
export default _default;
