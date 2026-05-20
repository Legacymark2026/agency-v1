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
import { BaseAgent } from './base';
import { STYLE_PRESETS } from './types';
export class LogosAgent extends BaseAgent {
    constructor(config) {
        super('logos', config);
    }
    async execute(context, input) {
        const startTime = Date.now();
        this.clearLogs();
        try {
            this.log('info', `Starting Logos analysis for ${input.clips.length} clips`);
            // 1. Analizar retención de cada clip
            const analysis = await this.analyzeFootage(input);
            // 2. Detectar el mejor hook
            const heroShot = this.detectHeroShot(analysis);
            // 3. Generar timeline optimizado
            const timeline = await this.generateTimeline(input, analysis, heroShot);
            // 4. Generar recomendaciones
            const recommendations = this.generateRecommendations(analysis, input);
            this.log('info', `Logos completed successfully. Timeline: ${timeline.length} segments`, {
                clipsAnalyzed: input.clips.length,
                heroShot,
                segments: timeline.length
            });
            return {
                success: true,
                data: {
                    timeline,
                    analysis,
                    heroShot,
                    recommendations
                },
                duration: Date.now() - startTime,
                logs: this.getLogs()
            };
        }
        catch (error) {
            this.log('error', `Logos execution failed: ${error.message}`);
            return {
                success: false,
                error: error.message,
                duration: Date.now() - startTime,
                logs: this.getLogs()
            };
        }
    }
    /**
     * Analiza el footage para determinar calidad, intención y energía de cada clip
     */
    async analyzeFootage(input) {
        var _a;
        const clipsData = input.clips.map(c => {
            var _a, _b;
            return `
Clip: ${c.id}
- Duración: ${c.duration}s
- Tags: ${((_a = c.tags) === null || _a === void 0 ? void 0 : _a.join(', ')) || 'none'}
- Resolución: ${c.resolution}
- FPS: ${c.fps}
- Intención metadata: ${((_b = c.metadata) === null || _b === void 0 ? void 0 : _b.intention) || 'unknown'}
    `.trim();
        }).join('\n\n');
        const prompt = `
Analiza los siguientes clips y devuelve un JSON con el análisis de cada uno.

Para cada clip:
1. **quality**: score de 0-100 basado en resolución, fps, enfoque, estabilidad, iluminación
2. **intention**: Determina si es 'hook', 'texture', 'process', 'reward', 'branding'
3. **energyLevel**: 'low', 'medium', 'high' basado en el movimiento y contenido
4. **recommendedFor**: ['hook', 'body', 'climax', 'b-roll', 'outro']
5. **recommendation**: Descripción breve de por qué es recomendado para esos segmentos

Clips:
${clipsData}

Devuelve JSON:
{
  "clips": [
    {
      "clipId": "id",
      "quality": 0-100,
      "intention": "hook|texture|process|reward|branding",
      "energyLevel": "low|medium|high",
      "recommendedFor": ["hook", "body"],
      "recommendation": "texto"
    }
  ],
  "avgQuality": 0-100,
  "totalDuration": number
}`;
        const result = await this.callGeminiJson(prompt);
        this.log('info', `Footage analysis complete: ${((_a = result.clips) === null || _a === void 0 ? void 0 : _a.length) || 0} clips analyzed`);
        return {
            clips: result.clips || [],
            heroShot: result.heroShot,
            totalDuration: result.totalDuration || input.clips.reduce((sum, c) => sum + c.duration, 0),
            avgQuality: result.avgQuality || 0
        };
    }
    /**
     * Detecta el mejor clip para ser el Hero Shot (gancho principal)
     */
    detectHeroShot(analysis) {
        var _a, _b;
        if (!analysis.clips || analysis.clips.length === 0) {
            return undefined;
        }
        // Scoring para hero shot
        const scoredClips = analysis.clips.map(clip => {
            var _a;
            let score = clip.quality || 0;
            // Bonus si está marcado como recomendado para hook
            if ((_a = clip.recommendedFor) === null || _a === void 0 ? void 0 : _a.includes('hook'))
                score += 20;
            // Bonus si tiene energía alta
            if (clip.energyLevel === 'high')
                score += 10;
            return { clipId: clip.clipId, score };
        });
        // Ordenar por score y devolver el mejor
        scoredClips.sort((a, b) => b.score - a.score);
        const heroShot = (_a = scoredClips[0]) === null || _a === void 0 ? void 0 : _a.clipId;
        this.log('info', `Hero shot detected: ${heroShot}`, { score: (_b = scoredClips[0]) === null || _b === void 0 ? void 0 : _b.score });
        return heroShot;
    }
    /**
     * Genera el timeline optimizado basado en el análisis
     */
    async generateTimeline(input, analysis, heroShot) {
        var _a, _b, _c, _d, _e, _f;
        const stylePreset = STYLE_PRESETS[input.style];
        const segments = [];
        // Agrupar clips por intención
        const hookClips = analysis.clips.filter(c => { var _a; return (_a = c.recommendedFor) === null || _a === void 0 ? void 0 : _a.includes('hook'); });
        const bodyClips = analysis.clips.filter(c => { var _a; return (_a = c.recommendedFor) === null || _a === void 0 ? void 0 : _a.includes('body'); });
        const climaxClips = analysis.clips.filter(c => { var _a; return (_a = c.recommendedFor) === null || _a === void 0 ? void 0 : _a.includes('climax'); });
        const bRollClips = analysis.clips.filter(c => { var _a; return (_a = c.recommendedFor) === null || _a === void 0 ? void 0 : _a.includes('b-roll'); });
        // 1. HOOK (primeros hookDuration segundos)
        if (hookClips.length > 0) {
            const hookSegment = {
                id: `segment-hook-${Date.now()}`,
                type: 'hook',
                clipIds: [heroShot || hookClips[0].clipId],
                duration: Math.min(input.hookDuration, hookClips.reduce((s, c) => {
                    const clip = input.clips.find(cl => cl.id === c.clipId);
                    return s + ((clip === null || clip === void 0 ? void 0 : clip.duration) || 0);
                }, 0)),
                transitions: ['none'],
                effects: [{ type: 'speed-ramp', config: { startSpeed: 30, endSpeed: 50, easing: 'ease-out' } }],
                metadata: { energy: 'high', beatSync: true }
            };
            segments.push(hookSegment);
        }
        // 2. BODY (segmentos principales)
        if (bodyClips.length > 0) {
            const bodyDuration = Math.max(input.duration - input.hookDuration - 4, 6); // resto menos climax y outro
            const avgClipDuration = bodyDuration / Math.min(bodyClips.length, Math.ceil(bodyDuration / stylePreset.minClipDuration));
            const bodySegment = {
                id: `segment-body-${Date.now()}`,
                type: 'body',
                clipIds: bodyClips.slice(0, Math.ceil(bodyDuration / avgClipDuration)).map(c => c.clipId),
                duration: bodyDuration,
                transitions: Array(bodyClips.length - 1).fill(stylePreset.transitionType),
                metadata: { energy: 'medium', beatSync: !!input.musicBpm, bpm: input.musicBpm }
            };
            segments.push(bodySegment);
        }
        // 3. CLIMAX (máxima energía)
        if (climaxClips.length > 0) {
            const climaxSegment = {
                id: `segment-climax-${Date.now()}`,
                type: 'climax',
                clipIds: climaxClips.map(c => c.clipId),
                duration: Math.min(4, climaxClips.reduce((s, c) => {
                    const clip = input.clips.find(cl => cl.id === c.clipId);
                    return s + ((clip === null || clip === void 0 ? void 0 : clip.duration) || 0);
                }, 0)),
                transitions: ['match-cut'],
                effects: [{ type: 'zoom', config: { scale: 1.1, duration: 0.5 } }],
                metadata: { energy: 'high', beatSync: true }
            };
            segments.push(climaxSegment);
        }
        // 4. OUTRO (cierre)
        const outroSegment = {
            id: `segment-outro-${Date.now()}`,
            type: 'outro',
            clipIds: [],
            duration: 2,
            transitions: ['fade'],
            metadata: { energy: 'low' }
        };
        segments.push(outroSegment);
        this.log('info', `Timeline generated: ${segments.length} segments`, {
            hook: ((_b = (_a = segments[0]) === null || _a === void 0 ? void 0 : _a.clipIds) === null || _b === void 0 ? void 0 : _b.length) || 0,
            body: ((_d = (_c = segments[1]) === null || _c === void 0 ? void 0 : _c.clipIds) === null || _d === void 0 ? void 0 : _d.length) || 0,
            climax: ((_f = (_e = segments[2]) === null || _e === void 0 ? void 0 : _e.clipIds) === null || _f === void 0 ? void 0 : _f.length) || 0
        });
        return segments;
    }
    /**
     * Genera recomendaciones basadas en el análisis
     */
    generateRecommendations(analysis, input) {
        const recommendations = [];
        // Recomendación de calidad
        if (analysis.avgQuality < 50) {
            recommendations.push('⚠️ La calidad promedio del footage es baja. Considera grabar tomas adicionales.');
        }
        // Recomendación de duración
        const totalDuration = analysis.clips.reduce((sum, c) => {
            const clip = input.clips.find(cl => cl.id === c.clipId);
            return sum + ((clip === null || clip === void 0 ? void 0 : clip.duration) || 0);
        }, 0);
        if (totalDuration < input.duration) {
            recommendations.push(`⚠️ La duración total del footage (${totalDuration}s) es menor que la objetivo (${input.duration}s).`);
        }
        // Recomendación de variety
        const intentions = new Set(analysis.clips.map(c => c.intention));
        if (intentions.size < 3) {
            recommendations.push('💡 Considera añadir variedad de tomas (process, texture, reward) para mejor storytelling.');
        }
        // Recomendación de energía
        const highEnergyCount = analysis.clips.filter(c => c.energyLevel === 'high').length;
        if (highEnergyCount < 2 && input.style === 'viral') {
            recommendations.push('💡 Para estilo viral, añade más tomas de alta energía.');
        }
        return recommendations;
    }
}
export default LogosAgent;
