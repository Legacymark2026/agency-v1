/**
 * Synthesis Agent - The Sintetizador
 * Detecta huecos creativos y propone soluciones
 */
import { TimelineGap, SynthesisAudit } from './types';
import { TimelineSegment, VideoClip } from '../agents/types';
export interface SynthesisConfig {
    projectId: string;
    companyId: string;
    clips: VideoClip[];
    timeline?: TimelineSegment[];
    voiceover?: string;
    style: string;
    platform: string;
    apiKeys: {
        pexels?: string;
        midjourney?: string;
        elevenlabs?: string;
        suno?: string;
    };
}
export interface GapDetectionResult {
    gaps: TimelineGap[];
    missingDuration: number;
    coveragePercent: number;
}
export declare class SynthesisAgent {
    private projectId;
    private companyId;
    private clips;
    private timeline;
    private voiceover;
    private style;
    private platform;
    private apiKeys;
    private gemini;
    constructor(config: SynthesisConfig);
    /**
     * Inicializa Gemini para análisis
     */
    private initGemini;
    /**
     * Ejecuta la auditoría completa del Síntetizador
     */
    runAudit(geminiApiKey: string): Promise<SynthesisAudit>;
    /**
     * Detecta huecos (gaps) en el timeline
     */
    private detectGaps;
    /**
     * Usa IA para detectar gaps semánticos
     */
    private detectGapsWithAI;
    /**
     * Infiere el tipo de gap basado en la duración
     */
    private inferGapType;
    /**
     * Extrae texto relacionado del voiceover
     */
    private extractRelatedScript;
    /**
     * Genera propuestas para cada gap
     */
    private generateProposals;
    /**
     * Determina la mejor fuente para el gap
     */
    private determineBestSource;
    /**
     * Genera query de búsqueda para stock
     */
    private generateSearchQuery;
    /**
     * Genera prompt para IA
     */
    private generateAIPrompt;
    /**
     * Estima costo de IA
     */
    private estimateAICost;
    /**
     * Aprueba una propuesta y ejecuta
     */
    approveProposal(proposalId: string, audit: SynthesisAudit): Promise<{
        success: boolean;
        result?: any;
        error?: string;
    }>;
    /**
     * Ejecuta búsqueda en stock
     */
    private executeStockSearch;
    /**
     * Ejecuta generación con IA
     */
    private executeAIGeneration;
    /**
     * Aplica un asset al timeline (simulado)
     */
    applyAssetToTimeline(assetId: string, gapId: string, audit: SynthesisAudit): any;
}
export default SynthesisAgent;
