/**
 * Graphos Agent - Diseñador Gráfico y Motion Graphics
 * The Editing Nexus - Diseñador
 *
 * Responsabilidades:
 * - Generación de subtítulos
 * - Validación de safe zones
 * - Motion graphics y animaciones
 * - Legibilidad y accesibilidad
 * - Lower thirds y CTAs
 */
import { BaseAgent, AgentConfig } from './base';
import { AgentContext, AgentResult, TextOverlay, SafeZoneValidation, MotionGraphic, Platform, TimelineSegment } from './types';
export interface GraphosInput {
    timeline: TimelineSegment[];
    platform: Platform;
    style: string;
    voiceover?: string;
    branding?: {
        logo?: string;
        font?: string;
        colors?: string[];
    };
}
export interface GraphosOutput {
    textOverlays: TextOverlay[];
    motionGraphics: MotionGraphic[];
    safeZoneValidations: SafeZoneValidation[];
    recommendations: string[];
}
export declare class GraphosAgent extends BaseAgent<GraphosInput, GraphosOutput> {
    constructor(config?: AgentConfig);
    execute(context: AgentContext, input: GraphosInput): Promise<AgentResult<GraphosOutput>>;
    /**
     * Genera los overlays de texto basándose en el timeline y voiceover
     */
    private generateTextOverlays;
    /**
     * Genera motion graphics (lower thirds, transiciones, etc.)
     */
    private generateMotionGraphics;
    /**
     * Valida las safe zones para cada overlay
     */
    private validateSafeZones;
    /**
     * Obtiene los límites de safe zone por plataforma
     */
    private getPlatformBounds;
    /**
     * Obtiene la fuente según el estilo
     */
    private getFont;
    /**
     * Obtiene el tamaño de fuente según la plataforma
     */
    private getFontSize;
    /**
     * Extrae el título del voiceover
     */
    private extractTitle;
    /**
     * Extrae el texto del hook
     */
    private extractHookText;
    /**
     * Genera el CTA según el estilo
     */
    private generateCTA;
    /**
     * Genera recomendaciones
     */
    private generateRecommendations;
}
export default GraphosAgent;
