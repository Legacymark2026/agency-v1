/**
 * Croma Agent - Colorista Profesional
 * The Editing Nexus - Colorista
 *
 * Responsabilidades:
 * - Corrección primaria de color
 * - Color grading según estilo
 * - Equalización entre cámaras
 * - Generación de looks cinematográficos
 */
import { BaseAgent, AgentConfig } from './base';
import { AgentContext, AgentResult, VideoClip, VideoStyle, ColorGradeConfig, ColorCorrection, VideoProject } from './types';
export interface CromaInput {
    clips: VideoClip[];
    style: VideoStyle;
    project?: Partial<VideoProject>;
    existingTimeline?: string[];
}
export interface CromaOutput {
    corrections: ColorCorrection[];
    globalGrade: ColorGradeConfig;
    recommendations: string[];
}
export declare class CromaAgent extends BaseAgent<CromaInput, CromaOutput> {
    constructor(config?: AgentConfig);
    execute(context: AgentContext, input: CromaInput): Promise<AgentResult<CromaOutput>>;
    /**
     * Analiza las características de color de cada clip
     */
    private analyzeColor;
    /**
     * Genera correcciones primarias para cada clip
     */
    private generatePrimaryCorrections;
    /**
     * Estima la temperatura basada en el análisis
     */
    private estimateTemperature;
    /**
     * Genera el color grading global según el estilo
     */
    private generateGlobalGrade;
    /**
     * Equaliza los colores entre diferentes cámaras
     */
    private equalizeCameras;
    /**
     * Genera recomendaciones de color
     */
    private generateRecommendations;
}
export default CromaAgent;
