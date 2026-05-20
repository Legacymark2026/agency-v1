/**
 * Clase base para todos los agentes de edición de video
 * The Editing Nexus - Base Agent Class
 */
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
export class BaseAgent {
    constructor(name, config = {}) {
        this.gemini = null;
        this.model = null;
        this.logs = [];
        this.name = name;
        this.config = Object.assign({ model: 'gemini-2.0-flash', temperature: 0.3, maxTokens: 8192 }, config);
    }
    /**
     * Inicializa el cliente de Gemini
     */
    async initGemini(apiKey) {
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
    async callGemini(prompt, systemInstruction) {
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
        }
        catch (error) {
            this.log('error', `Gemini API error: ${error.message}`);
            throw new Error(`Agent ${this.name} failed: ${error.message}`);
        }
    }
    /**
     * Llama a Gemini y parsea el resultado como JSON
     */
    async callGeminiJson(prompt, systemInstruction) {
        const response = await this.callGemini(prompt, systemInstruction);
        try {
            // Intentar parsear como JSON directamente
            return JSON.parse(response);
        }
        catch (_a) {
            // Si falla, intentar extraer JSON del texto
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error(`Failed to parse JSON from response: ${response.substring(0, 100)}...`);
        }
    }
    /**
     * Obtiene el system prompt específico del agente
     */
    getSystemPrompt() {
        const prompts = {
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
    log(level, message, metadata) {
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
    clearLogs() {
        this.logs = [];
    }
    /**
     * Obtiene los logs actuales
     */
    getLogs() {
        return [...this.logs];
    }
    /**
     * Obtiene el nombre del agente
     */
    getName() {
        return this.name;
    }
}
/**
 * Factory para crear agentes
 */
export class AgentFactory {
    static register(name, agentClass) {
        this.agents.set(name, agentClass);
    }
    static create(name, config) {
        const AgentClass = this.agents.get(name);
        if (!AgentClass) {
            console.error(`Agent ${name} not registered`);
            return null;
        }
        return new AgentClass(name, config);
    }
    static getAvailableAgents() {
        return Array.from(this.agents.keys());
    }
}
AgentFactory.agents = new Map();
export default BaseAgent;
