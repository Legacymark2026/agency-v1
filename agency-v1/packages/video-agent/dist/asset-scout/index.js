/**
 * Asset Scout - The Multi-Source Engine
 * ─────────────────────────────────────────────────────────────
 * Módulo para gestión de assets externos:
 * - Generación de IA (Midjourney, DALL-E, Runway, Suno)
 * - Stock Video (Pexels, Adobe Stock)
 * - Síntetizador (detector de huecos)
 * - Style Matcher (Film Grain Injection)
 * - Sistema de Créditos
 */
// Tipos
export * from './types';
// Clientes de API
export { MidjourneyClient, DalleClient, createImageClient } from './image-generator';
export { PexelsClient, AdobeStockClient, createStockClient, searchStock } from './stock-search';
export { ElevenLabsClient, SunoClient, createAudioClient } from './audio-generator';
// Agentes y Servicios
export { SynthesisAgent } from './synthesis-agent';
export { StyleMatcher } from './style-matcher';
export { CreditManager } from './credit-manager';
// ============================================
// EJEMPLO DE USO
// ============================================
/*
// 1. Crear Síntetizador
const synthesizer = new SynthesisAgent({
  projectId: 'proj-123',
  companyId: 'company-456',
  clips: clipsArray,
  timeline: timelineArray,
  voiceover: 'El café perfecto...',
  style: 'luxury',
  platform: 'reels',
  apiKeys: { pexels: 'key', midjourney: 'key' }
});

// 2. Ejecutar auditoría
const audit = await synthesizer.runAudit(geminiApiKey);

// 3. Ver huecos detectados
console.log('Gaps encontrados:', audit.gaps);
console.log('Propuestas:', audit.proposals);

// 4. Aprobar propuesta
const result = await synthesizer.approveProposal(proposalId, audit);

// 5. Aplicar Style Matcher para blending
const matcher = new StyleMatcher();
const profile = matcher.analyzeSourceVideo(mainClip);
const grainConfig = matcher.applyFilmGrainInjection(profile, assetId);

// 6. Verificar créditos
const balance = await CreditManager.getBalance(companyId);
*/
// Exportaciones por defecto
import { SynthesisAgent } from './synthesis-agent';
import { StyleMatcher } from './style-matcher';
import { CreditManager } from './credit-manager';
import { createImageClient } from './image-generator';
import { createStockClient } from './stock-search';
import { createAudioClient } from './audio-generator';
import { searchStock } from './stock-search';
export default {
    SynthesisAgent,
    StyleMatcher,
    CreditManager,
    createImageClient,
    createStockClient,
    createAudioClient,
    searchStock
};
