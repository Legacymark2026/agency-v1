/**
 * Clase base para todos los agentes de edición de video
 * The Editing Nexus - Base Agent Class
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { 
  AgentName, 
  AgentContext, 
  AgentResult, 
  AgentLog,
  VideoProject
} from './types';

export interface AgentConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export abstract class BaseAgent<TInput, TOutput> {
  protected name: AgentName;
  protected config: AgentConfig;
  protected gemini: GoogleGenerativeAI | null = null;
  protected model: any = null;
  protected logs: AgentLog[] = [];

  constructor(name: AgentName, config: AgentConfig = {}) {
    this.name = name;
    this.config = {
      model: 'gemini-2.0-flash',
      temperature: 0.3,
      maxTokens: 8192,
      ...config
    };
  }

  /**
   * Método abstract que cada agente debe implementar
   */
  abstract execute(context: AgentContext, input: TInput): Promise<AgentResult<TOutput>>;

  /**
   * Inicializa el cliente de Gemini
   */
  protected async initGemini(apiKey: string): Promise<void> {
    if (!this.gemini) {
      this.gemini = new GoogleGenerativeAI(apiKey);
      this.model = this.gemini.getGenerativeModel({
        model: this.config.model || 'gemini-2.0-flash',
        generationConfig: {
          temperature: this.config.temperature || 0.3,
          maxOutputTokens: this.config.maxTokens || 8192,
        },
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        ]
      });
    }
  }

  /**
   * Llama a Gemini con un prompt
   */
  protected async callGemini(prompt: string, systemInstruction?: string): Promise<string> {
    if (!this.model) {
      throw new Error('Gemini not initialized. Call initGemini first.');
    }

    try {
      const generationConfig = {
        temperature: this.config.temperature,
        maxOutputTokens: this.config.maxTokens,
      };

      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        systemInstruction: systemInstruction || this.getSystemPrompt(),
        generationConfig
      });

      const response = result.response;
      return response.text();
    } catch (error: any) {
      this.log('error', `Gemini API error: ${error.message}`);
      throw new Error(`Agent ${this.name} failed: ${error.message}`);
    }
  }

  /**
   * Llama a Gemini y parsea el resultado como JSON
   */
  protected async callGeminiJson<T>(prompt: string, systemInstruction?: string): Promise<T> {
    const response = await this.callGemini(prompt, systemInstruction);
    
    try {
      // Intentar parsear como JSON directamente
      return JSON.parse(response) as T;
    } catch {
      // Si falla, intentar extraer JSON del texto
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as T;
      }
      throw new Error(`Failed to parse JSON from response: ${response.substring(0, 100)}...`);
    }
  }

  /**
   * Obtiene el system prompt específico del agente
   */
  protected getSystemPrompt(): string {
    const prompts: Record<AgentName, string> = {
      logos: `
Eres Logos, el Estratega de Edición de Video.
Tu función es analizar el footage, detectar el hook perfecto, optimizar el ritmo y seleccionar las mejores tomas.
Tienes conocimiento profundo de:
- Psicología del viewer (ganchos, retención)
- Ritmo y pacing (cortes, transiciones)
- Storytelling visual
- Análisis de engagement

Reglas:
- Siempre busca maximizar la retención del viewer
- El hook debe ser en los primeros 3 segundos
- Los cortes deben seguir el beat de la música
- Evita tiempos muertos
-返回JSON格式的结果`,
      
      croma: `
Eres Croma, el Colorista Profesional de Video.
Tu función es la corrección de color, el color grading y la equalización entre cámaras.
Tienes conocimiento profundo de:
- Color science (temperatura, tinte, saturación)
- LUTs y looks cinematográficos
- Equalización de color entre diferentes cámaras
- Estilos visuales (lujo, urbano, orgánico,etc.)

Reglas:
- Mantén consistencia de color entre todos los clips
- Aplica el look apropiado según el estilo del proyecto
- Evita sobre-saturación o looks falsos
-返回JSON格式的结果`,
      
      phonos: `
Eres Phonos, el Ingeniero de Audio.
Tu función es la mezcla de audio, normalización, limpieza de ruido y ducking.
Tienes conocimiento profundo de:
- Normalización de audio (-14 LUFS estándar)
- Audio ducking y sidechain
- Limpieza de ruido
- Mezcla de capas (música, voz, SFX)

Reglas:
- La voz debe ser siempre clara (-16 LUFS máximo)
- La música no debe tapar la voz
- Aplica ducking automático cuando haya voz
-返回JSON格式的结果`,
      
      graphos: `
Eres Graphos, el Diseñador Gráfico y de Motion Graphics.
Tu función es crear subtítulos, validar safe zones y añadir motion graphics.
Tienes conocimiento profundo de:
- Tipografía y diseño visual
- Safe zones de cada plataforma
- Animaciones de texto
- Legibilidad y accesibilidad

Reglas:
- Todo texto debe estar en zona segura
- Los subtítulos deben ser legibles
- Usa animaciones apropiadas al estilo
- Evita textos que interfieran con elementos UI
-返回JSON格式的结果`
    };

    return prompts[this.name];
  }

  /**
   * Registra un log
   */
  protected log(level: AgentLog['level'], message: string, metadata?: Record<string, any>): void {
    this.logs.push({
      timestamp: new Date(),
      level,
      message,
      metadata
    });
  }

  /**
   * Limpia los logs
   */
  protected clearLogs(): void {
    this.logs = [];
  }

  /**
   * Obtiene los logs actuales
   */
  protected getLogs(): AgentLog[] {
    return [...this.logs];
  }

  /**
   * Obtiene el nombre del agente
   */
  getName(): AgentName {
    return this.name;
  }
}

/**
 * Factory para crear agentes
 */
export class AgentFactory {
  private static agents: Map<AgentName, typeof BaseAgent> = new Map();

  static register(name: AgentName, agentClass: typeof BaseAgent): void {
    this.agents.set(name, agentClass);
  }

  static create<T extends BaseAgent<any, any>>(name: AgentName, config?: AgentConfig): T | null {
    const AgentClass = this.agents.get(name) as any;
    if (!AgentClass) {
      console.error(`Agent ${name} not registered`);
      return null;
    }
    return new AgentClass(name, config) as T;
  }

  static getAvailableAgents(): AgentName[] {
    return Array.from(this.agents.keys());
  }
}

export default BaseAgent;