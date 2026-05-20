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
import { GoogleGenerativeAI } from "@google/generative-ai";
import { LogosAgent } from './logos';
import { CromaAgent } from './croma';
import { PhonosAgent } from './phonos';
import { GraphosAgent } from './graphos';
let database = null;
export function initDatabase(db) {
    database = db;
}
function getDatabase() {
    if (!database) {
        throw new Error("Database not initialized. Call initDatabase(db) first.");
    }
    return database;
}
export class AgentCoordinator {
    constructor(companyId, apiKey) {
        this.logs = [];
        this.companyId = companyId;
        this.apiKey = apiKey;
    }
    log(message) {
        const timestamp = new Date().toISOString();
        this.logs.push(`[${timestamp}] ${message}`);
        console.log(`[Coordinator] ${message}`);
    }
    /**
     * Ejecuta el flujo completo de edición con los 4 agentes
     */
    async executeFullWorkflow(input) {
        var _a, _b, _c, _d, _e;
        this.log('🚀 Starting full editing workflow');
        const context = {
            projectId: input.projectId,
            companyId: this.companyId
        };
        try {
            // ============================================
            // FASE 1: LOGOS - Análisis y Timeline
            // ============================================
            this.log('📊 FASE 1: Ejecutando Logos (Estratega)');
            const logosInput = {
                clips: input.clips,
                style: input.style,
                duration: input.duration,
                hookDuration: input.hookDuration,
                platform: input.platform
            };
            const logosAgent = new LogosAgent();
            await logosAgent['initGemini'](this.apiKey);
            const logosResult = await logosAgent.execute(context, logosInput);
            if (!logosResult.success) {
                throw new Error(`Logos failed: ${logosResult.error}`);
            }
            const timeline = ((_a = logosResult.data) === null || _a === void 0 ? void 0 : _a.timeline) || [];
            this.log(`✅ Logos completed: ${timeline.length} timeline segments`);
            // Guardar timeline en DB
            await this.saveToProject(input.projectId, { timeline, status: 'analyzing' });
            // ============================================
            // FASE 2: CROMA - Color Grading
            // ============================================
            this.log('🎨 FASE 2: Ejecutando Croma (Colorista)');
            const cromaInput = {
                clips: input.clips,
                style: input.style,
                project: { style: input.style },
                existingTimeline: timeline.map(t => t.id)
            };
            const cromaAgent = new CromaAgent();
            await cromaAgent['initGemini'](this.apiKey);
            const cromaResult = await cromaAgent.execute(context, cromaInput);
            if (!cromaResult.success) {
                this.log(`⚠️ Croma warning: ${cromaResult.error}`);
            }
            const colorGrade = ((_b = cromaResult.data) === null || _b === void 0 ? void 0 : _b.globalGrade) || {};
            this.log(`✅ Croma completed: ${colorGrade.lut || 'default'} LUT applied`);
            // Guardar color grade en DB
            await this.saveToProject(input.projectId, { colorGrade, status: 'editing' });
            // ============================================
            // FASE 3: PHONOS - Audio Engineering
            // ============================================
            this.log('🔊 FASE 3: Ejecutando Phonos (Ingeniero de Audio)');
            const phonosInput = {
                audioConfig: {
                    music: input.audioUrl ? { url: input.audioUrl, type: 'music', duration: input.duration } : undefined,
                    voiceover: input.voiceover ? { url: '', type: 'voiceover', duration: input.duration } : undefined
                },
                timelineDuration: input.duration,
                hasVoiceover: !!input.voiceover,
                platform: input.platform,
                style: input.style
            };
            const phonosAgent = new PhonosAgent();
            await phonosAgent['initGemini'](this.apiKey);
            const phonosResult = await phonosAgent.execute(context, phonosInput);
            if (!phonosResult.success) {
                this.log(`⚠️ Phonos warning: ${phonosResult.error}`);
            }
            const audioMix = ((_c = phonosResult.data) === null || _c === void 0 ? void 0 : _c.mix) || { masterLUFS: -14, layers: [], ducking: [] };
            this.log(`✅ Phonos completed: Master ${audioMix.masterLUFS} LUFS`);
            // Guardar audio mix en DB
            await this.saveToProject(input.projectId, { audioMix });
            // ============================================
            // FASE 4: GRAPHOS - Text & Motion
            // ============================================
            this.log('✏️ FASE 4: Ejecutando Graphos (Diseñador)');
            const graphosInput = {
                timeline,
                platform: input.platform,
                style: input.style,
                voiceover: input.voiceover
            };
            const graphosAgent = new GraphosAgent();
            await graphosAgent['initGemini'](this.apiKey);
            const graphosResult = await graphosAgent.execute(context, graphosInput);
            if (!graphosResult.success) {
                this.log(`⚠️ Graphos warning: ${graphosResult.error}`);
            }
            const textOverlays = ((_d = graphosResult.data) === null || _d === void 0 ? void 0 : _d.textOverlays) || [];
            const motionGraphics = ((_e = graphosResult.data) === null || _e === void 0 ? void 0 : _e.motionGraphics) || [];
            this.log(`✅ Graphos completed: ${textOverlays.length} overlays, ${motionGraphics.length} graphics`);
            // Guardar text overlays en DB
            await this.saveToProject(input.projectId, {
                textOverlays,
                status: 'review'
            });
            // ============================================
            // FASE 5: Quality Check
            // ============================================
            this.log('🔍 FASE 5: Running Quality Check');
            const qualityCheck = this.performQualityCheck({
                timeline,
                colorGrade,
                audioMix,
                textOverlays,
                platform: input.platform,
                duration: input.duration,
                hookDuration: input.hookDuration
            });
            this.log(`✅ Quality Check: ${qualityCheck.passed ? 'PASSED' : 'FAILED'} (Score: ${qualityCheck.score}/100)`);
            // ============================================
            // FASE 6: Generate Versions (A, B, C)
            // ============================================
            this.log('📱 FASE 6: Generating Version Alternatives');
            const versions = this.generateVersions(timeline, input.style);
            // ============================================
            // FASE 7: Generate Metadata
            // ============================================
            this.log('📝 FASE 7: Generating SEO Metadata');
            const metadata = await this.generateMetadata(input);
            // ============================================
            // RESUMEN FINAL
            // ============================================
            this.log('🎉 Workflow completed successfully!');
            this.log(`   - Timeline: ${timeline.length} segments`);
            this.log(`   - Color: ${colorGrade.lut || 'default'} LUT`);
            this.log(`   - Audio: ${audioMix.masterLUFS} LUFS`);
            this.log(`   - Text: ${textOverlays.length} overlays`);
            this.log(`   - Quality: ${qualityCheck.score}/100`);
            return {
                timeline,
                colorGrade,
                audioMix,
                textOverlays,
                motionGraphics,
                qualityCheck,
                versions,
                metadata
            };
        }
        catch (error) {
            this.log(`❌ Workflow failed: ${error.message}`);
            await this.saveToProject(input.projectId, {
                status: 'failed',
                error: error.message
            });
            throw error;
        }
    }
    /**
     * Ejecuta un agente específico por nombre
     */
    async executeAgent(agentName, context, input) {
        this.log(`Executing agent: ${agentName}`);
        const agents = {
            logos: LogosAgent,
            croma: CromaAgent,
            phonos: PhonosAgent,
            graphos: GraphosAgent
        };
        const AgentClass = agents[agentName];
        if (!AgentClass) {
            throw new Error(`Unknown agent: ${agentName}`);
        }
        const agent = new AgentClass();
        await agent['initGemini'](this.apiKey);
        return await agent.execute(context, input);
    }
    /**
     * Procesa un comando del usuario y lo dirige al agente apropiado
     */
    async processCommand(projectId, command) {
        var _a, _b, _c, _d;
        this.log(`Processing command: "${command}"`);
        // Parsear el comando para determinar el agente
        const commandLower = command.toLowerCase();
        let agentName = 'logos'; // Default
        if (commandLower.includes('color') || commandLower.includes('satur') ||
            commandLower.includes('lut') || commandLower.includes('contrast')) {
            agentName = 'croma';
        }
        else if (commandLower.includes('audio') || commandLower.includes('música') ||
            commandLower.includes('sonido') || commandLower.includes('volume')) {
            agentName = 'phonos';
        }
        else if (commandLower.includes('texto') || commandLower.includes('caption') ||
            commandLower.includes('subtítulo') || commandLower.includes('overlay')) {
            agentName = 'graphos';
        }
        // Obtener proyecto actual
        const db = getDatabase();
        const project = await db.videoProject.findUnique({ where: { id: projectId } });
        if (!project) {
            throw new Error('Project not found');
        }
        const clips = project.clips || [];
        const timeline = project.timeline || [];
        const textOverlays = project.textOverlays || [];
        // Ejecutar el agente apropiado
        const context = {
            projectId,
            companyId: this.companyId
        };
        let result;
        switch (agentName) {
            case 'logos':
                result = await this.executeAgent(agentName, context, {
                    clips,
                    style: project.style,
                    duration: project.duration,
                    hookDuration: project.hookDuration,
                    platform: project.platform
                });
                if (result.success && ((_a = result.data) === null || _a === void 0 ? void 0 : _a.timeline)) {
                    await this.saveToProject(projectId, { timeline: result.data.timeline });
                }
                break;
            case 'croma':
                result = await this.executeAgent(agentName, context, {
                    clips,
                    style: project.style
                });
                if (result.success && ((_b = result.data) === null || _b === void 0 ? void 0 : _b.globalGrade)) {
                    await this.saveToProject(projectId, { colorGrade: result.data.globalGrade });
                }
                break;
            case 'phonos':
                result = await this.executeAgent(agentName, context, {
                    audioConfig: { music: { url: project.audioUrl || '', type: 'music', duration: project.duration } },
                    timelineDuration: project.duration,
                    hasVoiceover: !!project.voiceover,
                    platform: project.platform,
                    style: project.style
                });
                if (result.success && ((_c = result.data) === null || _c === void 0 ? void 0 : _c.mix)) {
                    await this.saveToProject(projectId, { audioMix: result.data.mix });
                }
                break;
            case 'graphos':
                result = await this.executeAgent(agentName, context, {
                    timeline,
                    platform: project.platform,
                    style: project.style,
                    voiceover: project.voiceover
                });
                if (result.success && ((_d = result.data) === null || _d === void 0 ? void 0 : _d.textOverlays)) {
                    await this.saveToProject(projectId, { textOverlays: result.data.textOverlays });
                }
                break;
        }
        return {
            success: (result === null || result === void 0 ? void 0 : result.success) || false,
            result: (result === null || result === void 0 ? void 0 : result.data) || (result === null || result === void 0 ? void 0 : result.error),
            agent: agentName
        };
    }
    /**
     * Realiza el quality check final
     */
    performQualityCheck(data) {
        var _a, _b;
        const issues = [];
        const warnings = [];
        let score = 100;
        // Verificar timeline
        if (!data.timeline || data.timeline.length === 0) {
            issues.push('Falta timeline');
            score -= 30;
        }
        // Verificar hook
        const hasHook = (_a = data.timeline) === null || _a === void 0 ? void 0 : _a.some((s) => s.type === 'hook');
        if (!hasHook) {
            issues.push('Falta segmento de Hook');
            score -= 15;
        }
        // Verificar audio
        if (!data.audioMix) {
            warnings.push('No se detectó configuración de audio');
            score -= 5;
        }
        else if (data.audioMix.masterLUFS > -12 || data.audioMix.masterLUFS < -16) {
            warnings.push(`Audio LUFS fuera de rango: ${data.audioMix.masterLUFS}`);
            score -= 5;
        }
        // Verificar text overlays
        if (((_b = data.textOverlays) === null || _b === void 0 ? void 0 : _b.length) === 0) {
            warnings.push('No hay overlays de texto');
            score -= 5;
        }
        // Verificar duración
        if (data.duration > 180 && data.platform === 'tiktok') {
            warnings.push('Duración excede límite de TikTok (180s)');
            score -= 10;
        }
        return {
            passed: issues.length === 0,
            score: Math.max(0, score),
            issues,
            warnings
        };
    }
    /**
     * Genera versiones alternativas (A, B, C)
     */
    generateVersions(timeline, style) {
        return [
            {
                version: 'A',
                name: 'Cinemática',
                description: 'Cortes elegantes, transiciones suaves, tono dramático',
                timeline: timeline.map(t => (Object.assign(Object.assign({}, t), { transitions: ['dissolve'] })))
            },
            {
                version: 'B',
                name: 'Viral/Dinámica',
                description: 'Cortes rápidos, energía alta, máximo engagement',
                timeline: timeline.map(t => (Object.assign(Object.assign({}, t), { transitions: ['jump-cut', 'cut'] })))
            },
            {
                version: 'C',
                name: 'Informativa',
                description: 'Clara, focada en el mensaje, texto prominente',
                timeline: timeline.map(t => (Object.assign(Object.assign({}, t), { transitions: ['fade'], duration: t.duration * 1.2 })))
            }
        ];
    }
    /**
     * Genera metadata para SEO y redes sociales
     */
    async generateMetadata(input) {
        const genAI = new GoogleGenerativeAI(this.apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const prompt = `
Genera metadata para un video de ${input.style} (${input.platform}) con duración ${input.duration}s.

Devuelve JSON:
{
  "seoTitle": "título SEO (máx 60 caracteres)",
  "seoDescription": "descripción SEO (máx 160 caracteres)",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"],
  "suggestedCTA": "llamada a la acción sugerida"
}`;
        try {
            const result = await model.generateContent(prompt);
            const metadata = JSON.parse(result.response.text());
            this.log('✅ SEO Metadata generated');
            return metadata;
        }
        catch (error) {
            this.log('⚠️ SEO Metadata generation failed, using defaults');
            return {
                seoTitle: input.style.charAt(0).toUpperCase() + input.style.slice(1) + ' Video',
                seoDescription: 'Video profesional editado con The Editing Nexus',
                hashtags: ['video', 'professional', 'editing', 'content'],
                suggestedCTA: 'Ver más'
            };
        }
    }
    /**
     * Guarda datos en el proyecto
     */
    async saveToProject(projectId, data) {
        try {
            const db = getDatabase();
            await db.videoProject.update({
                where: { id: projectId },
                data: Object.assign(Object.assign({}, data), { updatedAt: new Date() })
            });
        }
        catch (error) {
            this.log(`⚠️ Failed to save to project: ${error}`);
        }
    }
    /**
     * Obtiene los logs del coordinator
     */
    getLogs() {
        return [...this.logs];
    }
    /**
     * Limpia los logs
     */
    clearLogs() {
        this.logs = [];
    }
}
/**
 * Factory para crear el coordinator
 */
export function createCoordinator(companyId, apiKey) {
    return new AgentCoordinator(companyId, apiKey);
}
export default AgentCoordinator;
