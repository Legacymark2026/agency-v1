/**
 * Synthesis Agent - The Sintetizador
 * Detecta huecos creativos y propone soluciones
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import { searchStock } from './stock-search';
import { createImageClient } from './image-generator';
export class SynthesisAgent {
    constructor(config) {
        this.gemini = null;
        this.projectId = config.projectId;
        this.companyId = config.companyId;
        this.clips = config.clips;
        this.timeline = config.timeline || [];
        this.voiceover = config.voiceover || '';
        this.style = config.style;
        this.platform = config.platform;
        this.apiKeys = config.apiKeys;
    }
    /**
     * Inicializa Gemini para análisis
     */
    async initGemini(apiKey) {
        if (!this.gemini) {
            this.gemini = new GoogleGenerativeAI(apiKey);
        }
    }
    /**
     * Ejecuta la auditoría completa del Síntetizador
     */
    async runAudit(geminiApiKey) {
        await this.initGemini(geminiApiKey);
        // 1. Detectar huecos en el timeline
        const gapResult = await this.detectGaps();
        // 2. Generar propuestas para cada gap
        const proposals = await this.generateProposals(gapResult.gaps);
        return {
            id: `audit-${Date.now()}`,
            projectId: this.projectId,
            status: 'completed',
            scriptLength: this.voiceover.length,
            timelineDuration: this.timeline.reduce((sum, s) => sum + s.duration, 0),
            missingDuration: gapResult.missingDuration,
            gaps: gapResult.gaps,
            proposals,
            appliedAssets: [],
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }
    /**
     * Detecta huecos (gaps) en el timeline
     */
    async detectGaps() {
        const gaps = [];
        const totalTimelineDuration = this.timeline.reduce((sum, s) => sum + s.duration, 0);
        const totalClipDuration = this.clips.reduce((sum, c) => sum + c.duration, 0);
        // Gap 1: Si la duración total de clips es menor que el timeline
        if (totalClipDuration < totalTimelineDuration) {
            const missingDuration = totalTimelineDuration - totalClipDuration;
            // Determinar tipo de gap basado en posición
            gaps.push({
                id: `gap-main-${Date.now()}`,
                startTime: 0,
                endTime: totalClipDuration,
                duration: missingDuration,
                type: this.inferGapType(totalClipDuration),
                severity: missingDuration > 5 ? 'critical' : missingDuration > 2 ? 'major' : 'minor',
                reason: `Faltan ${missingDuration.toFixed(1)}s de contenido para completar el timeline`,
                relatedScript: this.extractRelatedScript(0, totalClipDuration)
            });
        }
        // Gap 2: Detectar gaps entre clips (si hay transiciones grandes)
        for (let i = 0; i < this.timeline.length - 1; i++) {
            const currentEnd = this.timeline[i].duration;
            const nextStart = this.timeline[i + 1].duration;
            if (nextStart - currentEnd > 2) {
                gaps.push({
                    id: `gap-transition-${i}`,
                    startTime: currentEnd,
                    endTime: nextStart,
                    duration: nextStart - currentEnd,
                    type: 'transition',
                    severity: 'minor',
                    reason: `Gap de ${(nextStart - currentEnd).toFixed(1)}s entre segmentos`,
                    relatedScript: this.extractRelatedScript(currentEnd, nextStart)
                });
            }
        }
        // Gap 3: Análisis con Gemini para detección inteligente
        if (this.gemini && this.voiceover) {
            const intelligentGaps = await this.detectGapsWithAI();
            gaps.push(...intelligentGaps);
        }
        const missingDuration = gaps.reduce((sum, g) => sum + g.duration, 0);
        const coveragePercent = totalClipDuration > 0
            ? (totalClipDuration / Math.max(totalTimelineDuration, 1)) * 100
            : 0;
        return { gaps, missingDuration, coveragePercent };
    }
    /**
     * Usa IA para detectar gaps semánticos
     */
    async detectGapsWithAI() {
        const model = this.gemini.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const prompt = `
Analiza este guion y timeline para detectar gaps creativos:

Guion: ${this.voiceover.substring(0, 1000)}
Timeline actual: ${this.timeline.length} segmentos
Clips subidos: ${this.clips.length}

Devuelve JSON con gaps detectados:
[
  {
    "type": "b-roll|transition|texture|background|drone|product|ambient",
    "reason": "por qué falta este contenido",
    "suggestedAction": "qué hacer para cubrirlo"
  }
]

Ejemplo: Si el guion menciona "café cayendo en taza" pero no hay clip de eso → type: "texture"
`;
        try {
            const result = await model.generateContent(prompt);
            const jsonMatch = result.response.text().match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const detected = JSON.parse(jsonMatch[0]);
                return detected.map((d, i) => ({
                    id: `gap-ai-${i}`,
                    startTime: 0,
                    endTime: 3,
                    duration: 3,
                    type: d.type,
                    severity: 'major',
                    reason: d.reason,
                    relatedScript: d.suggestedAction
                }));
            }
        }
        catch (error) {
            console.error('Error en detección con IA:', error);
        }
        return [];
    }
    /**
     * Infiere el tipo de gap basado en la duración
     */
    inferGapType(clipDuration) {
        if (clipDuration < 5)
            return 'product';
        if (clipDuration < 10)
            return 'texture';
        if (clipDuration < 20)
            return 'b-roll';
        return 'background';
    }
    /**
     * Extrae texto relacionado del voiceover
     */
    extractRelatedScript(start, end) {
        const words = this.voiceover.split(' ');
        const wordsPerSecond = words.length / Math.max(this.timeline.reduce((s, t) => s + t.duration, 1), 1);
        const startWord = Math.floor(start * wordsPerSecond);
        const endWord = Math.ceil(end * wordsPerSecond);
        return words.slice(startWord, Math.min(endWord, words.length)).join(' ').substring(0, 100);
    }
    /**
     * Genera propuestas para cada gap
     */
    async generateProposals(gaps) {
        const proposals = [];
        for (const gap of gaps) {
            // Determinar mejor fuente según tipo de gap
            const source = this.determineBestSource(gap);
            if (source === 'stock') {
                // Buscar en Pexels
                const searchQuery = this.generateSearchQuery(gap);
                const cost = 1; // CREDIT_COSTS.pexels
                proposals.push({
                    gapId: gap.id,
                    source: 'stock',
                    provider: 'pexels',
                    searchQuery,
                    estimatedCost: cost,
                    estimatedDuration: 5,
                    status: 'pending'
                });
            }
            else if (source === 'ai') {
                // Generar con IA
                const prompt = this.generateAIPrompt(gap);
                const cost = this.estimateAICost(gap.type);
                proposals.push({
                    gapId: gap.id,
                    source: 'ai',
                    provider: 'midjourney',
                    prompt,
                    estimatedCost: cost,
                    estimatedDuration: 30,
                    status: 'pending'
                });
            }
            else {
                // Manual - esperar input del usuario
                proposals.push({
                    gapId: gap.id,
                    source: 'manual',
                    estimatedCost: 0,
                    estimatedDuration: 0,
                    status: 'pending'
                });
            }
        }
        return proposals;
    }
    /**
     * Determina la mejor fuente para el gap
     */
    determineBestSource(gap) {
        // Si es transición o tipo crítico → stock (más rápido)
        if (gap.type === 'transition' || gap.severity === 'critical') {
            return 'stock';
        }
        // Si es texture/drone de alta calidad → AI
        if (gap.type === 'drone' || gap.type === 'texture') {
            return 'ai';
        }
        // Default: mixed (proponer ambos)
        return 'mixed';
    }
    /**
     * Genera query de búsqueda para stock
     */
    generateSearchQuery(gap) {
        const typeQueries = {
            'b-roll': 'lifestyle professional',
            'transition': 'abstract smooth',
            'texture': 'macro detail close-up',
            'background': 'modern clean',
            'drone': 'aerial view landscape',
            'product': 'product shot studio',
            'ambient': 'background atmosphere'
        };
        return `${typeQueries[gap.type]} ${this.style} ${this.platform}`;
    }
    /**
     * Genera prompt para IA
     */
    generateAIPrompt(gap) {
        const basePrompts = {
            'b-roll': 'Professional lifestyle footage, natural lighting, high quality',
            'transition': 'Smooth abstract transition effect, cinematic',
            'texture': 'Macro close-up texture, detailed, professional lighting',
            'background': 'Modern minimalist background, clean, professional',
            'drone': 'Cinematic aerial drone shot, golden hour, professional',
            'product': 'Premium product shot, studio lighting, luxury',
            'ambient': 'Atmospheric background, mood, professional'
        };
        return `${basePrompts[gap.type]}, ${gap.reason}, ${this.style} style, high quality, 4k`;
    }
    /**
     * Estima costo de IA
     */
    estimateAICost(type) {
        const costs = {
            'b-roll': 20,
            'transition': 10,
            'texture': 5,
            'background': 15,
            'drone': 25,
            'product': 18,
            'ambient': 12
        };
        return costs[type] || 10;
    }
    /**
     * Aprueba una propuesta y ejecuta
     */
    async approveProposal(proposalId, audit) {
        const proposal = audit.proposals.find(p => p.gapId === proposalId);
        if (!proposal) {
            return { success: false, error: 'Proposal not found' };
        }
        // Verificar créditos disponibles (implementar después)
        // Ejecutar según tipo
        if (proposal.source === 'stock' && proposal.searchQuery) {
            return await this.executeStockSearch(proposal);
        }
        else if (proposal.source === 'ai' && proposal.prompt) {
            return await this.executeAIGeneration(proposal);
        }
        return { success: false, error: 'Manual intervention required' };
    }
    /**
     * Ejecuta búsqueda en stock
     */
    async executeStockSearch(proposal) {
        if (!this.apiKeys.pexels) {
            return { success: false, error: 'Pexels API key not configured' };
        }
        try {
            const result = await searchStock(proposal.searchQuery || '', 'pexels', this.apiKeys.pexels);
            return {
                success: true,
                results: result.results,
                provider: 'pexels',
                estimatedCost: proposal.estimatedCost
            };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    /**
     * Ejecuta generación con IA
     */
    async executeAIGeneration(proposal) {
        if (!this.apiKeys.midjourney) {
            return { success: false, error: 'Midjourney API key not configured' };
        }
        try {
            const client = createImageClient('midjourney', this.apiKeys.midjourney);
            const result = await client.generateImage({
                provider: 'midjourney',
                prompt: proposal.prompt || '',
                width: 1080,
                height: 1920,
                platform: this.platform,
                style: this.style
            });
            return {
                success: result.success,
                asset: result.asset,
                cost: result.cost
            };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    /**
     * Aplica un asset al timeline (simulado)
     */
    applyAssetToTimeline(assetId, gapId, audit) {
        // Actualizar proposal status
        const proposal = audit.proposals.find(p => p.gapId === gapId);
        if (proposal) {
            proposal.status = 'applied';
            proposal.asset = {
                id: assetId,
                projectId: this.projectId,
                sourceType: 'ai_generated',
                sourceProvider: 'midjourney',
                status: 'applied',
                createdAt: new Date()
            };
        }
        return { success: true, message: 'Asset applied to timeline' };
    }
}
export default SynthesisAgent;
