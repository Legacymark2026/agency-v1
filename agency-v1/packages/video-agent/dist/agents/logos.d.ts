/**
 * Logos Agent - Estratega de Edición
 * The Editing Nexus - Estratega
 *
 * Responsabilidades:
 * - Análisis de retención
 * - Detección de Hook
 * - Selección de mejores tomas
 * - Optimización de ritmo/pacing
 * - Generación de timeline
 */
import { BaseAgent, AgentConfig } from './base';
import { AgentContext, AgentResult, VideoClip, TimelineSegment, FootageAnalysis, VideoStyle } from './types';
export interface LogosInput {
    clips: VideoClip[];
    style: VideoStyle;
    duration: number;
    hookDuration: number;
    platform: string;
    musicBpm?: number;
}
export interface LogosOutput {
    timeline: TimelineSegment[];
    analysis: FootageAnalysis;
    heroShot?: string;
    recommendations: string[];
}
export declare class LogosAgent extends BaseAgent<LogosInput, LogosOutput> {
    constructor(config?: AgentConfig);
    execute(context: AgentContext, input: LogosInput): Promise<AgentResult<LogosOutput>>;
    /**
     * Analiza el footage para determinar calidad, intención y energía de cada clip
     */
    private analyzeFootage;
    /**
     * Detecta el mejor clip para ser el Hero Shot (gancho principal)
     */
    private detectHeroShot;
    /**
     * Genera el timeline optimizado basado en el análisis
     */
    private generateTimeline;
    /**
     * Genera recomendaciones basadas en el análisis
     */
    private generateRecommendations;
}
export default LogosAgent;
