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

// Tipos principales
export * from './agents/types';

// Asset Scout
export * from './asset-scout';

// Re-exportar CoordinatorInput
export type { CoordinatorInput } from './agents/types';

// Agentes
export { LogosAgent } from './agents/logos';
export { CromaAgent } from './agents/croma';
export { PhonosAgent } from './agents/phonos';
export { GraphosAgent } from './agents/graphos';
export { BaseAgent, AgentFactory } from './agents/base';

// Coordinator
export { AgentCoordinator, createCoordinator, initDatabase } from './agents/coordinator';

// Constantes
export { PLATFORM_SPECS, STYLE_PRESETS } from './agents/types';

// ============================================
// ENTRY POINT - BACKEND
// ============================================

import { createCoordinator, AgentCoordinator, initDatabase } from './agents/coordinator';

// ============================================
// FUNCIONES DE Factory
// ============================================

export function createVideoEditorAgent(companyId: string, apiKey: string): AgentCoordinator {
  return createCoordinator(companyId, apiKey);
}

// ============================================
// INTERFAZ DE BASE DE DATOS (para compatibilidad)
// ============================================

export interface VideoAgentDbInterface {
  integrationConfig: {
    findUnique: (args: { where: { companyId_provider: { companyId: string; provider: string } } }) => Promise<any>;
  };
  videoProject: {
    create: (args: { data: any }) => Promise<any>;
    findUnique: (args: { where: { id: string }; include?: any }) => Promise<any>;
    update: (args: { where: { id: string }; data: any }) => Promise<any>;
    findMany: (args: { where: any; orderBy?: any; take?: number; include?: any }) => Promise<any[]>;
    delete: (args: { where: { id: string } }) => Promise<any>;
  };
  editVersion: {
    create: (args: { data: any }) => Promise<any>;
    update: (args: { where: { id: string }; data: any }) => Promise<any>;
  };
  workflowStep: {
    create: (args: { data: any }) => Promise<any>;
  };
}

// Alias para compatibilidad
export type VideoDbInterface = VideoAgentDbInterface;

// ============================================
// SYSTEM PROMPT
// ============================================

export const VIDEO_AGENT_SYSTEM_PROMPT = `
Eres Lead Video Engineer & AI Content Architect especializado en edición para redes sociales.

TU MISIÓN:
- Liderar un enjambre de 4 agentes especializados:
  * Logos (Estratega): Análisis de retención, detección de Hook, timeline
  * Croma (Colorista): Color grading, corrección, looks cinematográficos
  * Phonos (Ingeniero de Audio): Mezcla, normalización, ducking
  * Graphos (Diseñador): Textos, motion graphics, safe zones

CONTROL HÍBRIDO:
- El usuario puede intervenir en cualquier momento
- Comandos estructurados: "Logos: detectHook", "Croma: applyLut luxury"
- O texto libre que se parseará automáticamente

ZONAS SEGURAS (por plataforma):
- TikTok/Reels: 15%-75% vertical
- YouTube: 10%-90% vertical
- Instagram Feed: 10%-85% vertical

ESTILOS:
- Cinematic: cortes elegantes, transiciones suaves
- Viral: cortes rápidos, energía alta
- Corporate: limpio, profesional
- Luxury: dorados, lento, elegante
- Bohemian: cálido, orgánico

CHECKLIST PRE-RENDER:
- Audio normalizado a -14 LUFS
- Color consistente entre clips
- Transiciones narrativas
- Formato óptimo para plataforma
- Texto en zona segura
- Hook en primeros 3 segundos
`;

export default {
  createVideoEditorAgent,
  createCoordinator,
  initDatabase,
  VIDEO_AGENT_SYSTEM_PROMPT
};