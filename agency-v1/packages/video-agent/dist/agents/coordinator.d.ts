/**
 * Agent Coordinator - Orquestador de Agentes
 * The Editing Nexus - Coordinator
 *
 * Coordina la ejecución de los 4 agentes especializados:
 * - Logos (Estratega)
 * - Croma (Colorista)
 * - Phonos (Ingeniero de Audio)
 * - Graphos (Diseñador)
 */
import { AgentName, AgentContext, AgentResult, VideoClip, TimelineSegment, Platform, VideoStyle, VideoDbInterface } from './types';
export interface CoordinatorInput {
    projectId: string;
    companyId: string;
    clips: VideoClip[];
    audioUrl?: string;
    outputFormat: string;
    platform: Platform;
    style: VideoStyle;
    duration: number;
    hookDuration: number;
    voiceover?: string;
}
export interface CoordinatorOutput {
    timeline: TimelineSegment[];
    colorGrade: any;
    audioMix: any;
    textOverlays: any[];
    motionGraphics: any[];
    qualityCheck: QualityCheckResult;
    versions?: EditVersionPreview[];
    metadata?: ProjectMetadataOutput;
}
export interface QualityCheckResult {
    passed: boolean;
    score: number;
    issues: string[];
    warnings: string[];
}
export interface EditVersionPreview {
    version: string;
    name: string;
    description: string;
    timeline: TimelineSegment[];
}
export interface ProjectMetadataOutput {
    seoTitle: string;
    seoDescription: string;
    hashtags: string[];
    suggestedCTA: string;
}
export declare function initDatabase(db: VideoDbInterface): void;
export declare class AgentCoordinator {
    private companyId;
    private apiKey;
    private logs;
    constructor(companyId: string, apiKey: string);
    private log;
    /**
     * Ejecuta el flujo completo de edición con los 4 agentes
     */
    executeFullWorkflow(input: CoordinatorInput): Promise<CoordinatorOutput>;
    /**
     * Ejecuta un agente específico por nombre
     */
    executeAgent(agentName: AgentName, context: AgentContext, input: any): Promise<AgentResult<any>>;
    /**
     * Procesa un comando del usuario y lo dirige al agente apropiado
     */
    processCommand(projectId: string, command: string): Promise<{
        success: boolean;
        result: any;
        agent: AgentName;
    }>;
    /**
     * Realiza el quality check final
     */
    private performQualityCheck;
    /**
     * Genera versiones alternativas (A, B, C)
     */
    private generateVersions;
    /**
     * Genera metadata para SEO y redes sociales
     */
    private generateMetadata;
    /**
     * Guarda datos en el proyecto
     */
    private saveToProject;
    /**
     * Obtiene los logs del coordinator
     */
    getLogs(): string[];
    /**
     * Limpia los logs
     */
    clearLogs(): void;
}
/**
 * Factory para crear el coordinator
 */
export declare function createCoordinator(companyId: string, apiKey: string): AgentCoordinator;
export default AgentCoordinator;
