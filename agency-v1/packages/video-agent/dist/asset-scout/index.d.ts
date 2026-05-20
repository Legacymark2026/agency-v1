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
export * from './types';
export { MidjourneyClient, DalleClient, createImageClient } from './image-generator';
export { PexelsClient, AdobeStockClient, createStockClient, searchStock } from './stock-search';
export { ElevenLabsClient, SunoClient, createAudioClient } from './audio-generator';
export { SynthesisAgent } from './synthesis-agent';
export { StyleMatcher } from './style-matcher';
export { CreditManager } from './credit-manager';
import { SynthesisAgent } from './synthesis-agent';
import { StyleMatcher } from './style-matcher';
import { CreditManager } from './credit-manager';
import { createImageClient } from './image-generator';
import { createStockClient } from './stock-search';
import { createAudioClient } from './audio-generator';
import { searchStock } from './stock-search';
declare const _default: {
    SynthesisAgent: typeof SynthesisAgent;
    StyleMatcher: typeof StyleMatcher;
    CreditManager: typeof CreditManager;
    createImageClient: typeof createImageClient;
    createStockClient: typeof createStockClient;
    createAudioClient: typeof createAudioClient;
    searchStock: typeof searchStock;
};
export default _default;
