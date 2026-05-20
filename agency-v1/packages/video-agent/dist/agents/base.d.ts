/**
 * Clase base para todos los agentes de edición de video
 * The Editing Nexus - Base Agent Class
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AgentName, AgentContext, AgentResult, AgentLog } from './types';
export interface AgentConfig {
    model?: string;
    temperature?: number;
    maxTokens?: number;
}
export declare abstract class BaseAgent<TInput, TOutput> {
    protected name: AgentName;
    protected config: AgentConfig;
    protected gemini: GoogleGenerativeAI | null;
    protected model: any;
    protected logs: AgentLog[];
    constructor(name: AgentName, config?: AgentConfig);
    /**
     * Método abstract que cada agente debe implementar
     */
    abstract execute(context: AgentContext, input: TInput): Promise<AgentResult<TOutput>>;
    /**
     * Inicializa el cliente de Gemini
     */
    protected initGemini(apiKey: string): Promise<void>;
    /**
     * Llama a Gemini con un prompt
     */
    protected callGemini(prompt: string, systemInstruction?: string): Promise<string>;
    /**
     * Llama a Gemini y parsea el resultado como JSON
     */
    protected callGeminiJson<T>(prompt: string, systemInstruction?: string): Promise<T>;
    /**
     * Obtiene el system prompt específico del agente
     */
    protected getSystemPrompt(): string;
    /**
     * Registra un log
     */
    protected log(level: AgentLog['level'], message: string, metadata?: Record<string, any>): void;
    /**
     * Limpia los logs
     */
    protected clearLogs(): void;
    /**
     * Obtiene los logs actuales
     */
    protected getLogs(): AgentLog[];
    /**
     * Obtiene el nombre del agente
     */
    getName(): AgentName;
}
/**
 * Factory para crear agentes
 */
export declare class AgentFactory {
    private static agents;
    static register(name: AgentName, agentClass: typeof BaseAgent): void;
    static create<T extends BaseAgent<any, any>>(name: AgentName, config?: AgentConfig): T | null;
    static getAvailableAgents(): AgentName[];
}
export default BaseAgent;
