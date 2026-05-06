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
import { 
  AgentContext, 
  AgentResult, 
  VideoClip, 
  TimelineSegment, 
  ClipAnalysis,
  FootageAnalysis,
  AgentName,
  STYLE_PRESETS,
  VideoStyle
} from './types';

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

export class LogosAgent extends BaseAgent<LogosInput, LogosOutput> {
  constructor(config?: AgentConfig) {
    super('logos', config);
  }

  async execute(context: AgentContext, input: LogosInput): Promise<AgentResult<LogosOutput>> {
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

    } catch (error: any) {
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
  private async analyzeFootage(input: LogosInput): Promise<FootageAnalysis> {
    const clipsData = input.clips.map(c => `
Clip: ${c.id}
- Duración: ${c.duration}s
- Tags: ${c.tags?.join(', ') || 'none'}
- Resolución: ${c.resolution}
- FPS: ${c.fps}
- Intención metadata: ${c.metadata?.intention || 'unknown'}
    `.trim()).join('\n\n');

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

    const result = await this.callGeminiJson<FootageAnalysis>(prompt);
    
    this.log('info', `Footage analysis complete: ${result.clips?.length || 0} clips analyzed`);
    
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
  private detectHeroShot(analysis: FootageAnalysis): string | undefined {
    if (!analysis.clips || analysis.clips.length === 0) {
      return undefined;
    }

    // Scoring para hero shot
    const scoredClips = analysis.clips.map(clip => {
      let score = clip.quality || 0;
      
      // Bonus si está marcado como recomendado para hook
      if (clip.recommendedFor?.includes('hook')) score += 20;
      
      // Bonus si tiene energía alta
      if (clip.energyLevel === 'high') score += 10;
      
      return { clipId: clip.clipId, score };
    });

    // Ordenar por score y devolver el mejor
    scoredClips.sort((a, b) => b.score - a.score);
    
    const heroShot = scoredClips[0]?.clipId;
    
    this.log('info', `Hero shot detected: ${heroShot}`, { score: scoredClips[0]?.score });
    
    return heroShot;
  }

  /**
   * Genera el timeline optimizado basado en el análisis
   */
  private async generateTimeline(
    input: LogosInput, 
    analysis: FootageAnalysis,
    heroShot?: string
  ): Promise<TimelineSegment[]> {
    const stylePreset = STYLE_PRESETS[input.style];
    const segments: TimelineSegment[] = [];

    // Agrupar clips por intención
    const hookClips = analysis.clips.filter(c => c.recommendedFor?.includes('hook'));
    const bodyClips = analysis.clips.filter(c => c.recommendedFor?.includes('body'));
    const climaxClips = analysis.clips.filter(c => c.recommendedFor?.includes('climax'));
    const bRollClips = analysis.clips.filter(c => c.recommendedFor?.includes('b-roll'));

    // 1. HOOK (primeros hookDuration segundos)
    if (hookClips.length > 0) {
      const hookSegment: TimelineSegment = {
        id: `segment-hook-${Date.now()}`,
        type: 'hook',
        clipIds: [heroShot || hookClips[0].clipId],
        duration: Math.min(input.hookDuration, hookClips.reduce((s, c) => {
          const clip = input.clips.find(cl => cl.id === c.clipId);
          return s + (clip?.duration || 0);
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
      
      const bodySegment: TimelineSegment = {
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
      const climaxSegment: TimelineSegment = {
        id: `segment-climax-${Date.now()}`,
        type: 'climax',
        clipIds: climaxClips.map(c => c.clipId),
        duration: Math.min(4, climaxClips.reduce((s, c) => {
          const clip = input.clips.find(cl => cl.id === c.clipId);
          return s + (clip?.duration || 0);
        }, 0)),
        transitions: ['match-cut'],
        effects: [{ type: 'zoom', config: { scale: 1.1, duration: 0.5 } }],
        metadata: { energy: 'high', beatSync: true }
      };
      segments.push(climaxSegment);
    }

    // 4. OUTRO (cierre)
    const outroSegment: TimelineSegment = {
      id: `segment-outro-${Date.now()}`,
      type: 'outro',
      clipIds: [],
      duration: 2,
      transitions: ['fade'],
      metadata: { energy: 'low' }
    };
    segments.push(outroSegment);

    this.log('info', `Timeline generated: ${segments.length} segments`, {
      hook: segments[0]?.clipIds?.length || 0,
      body: segments[1]?.clipIds?.length || 0,
      climax: segments[2]?.clipIds?.length || 0
    });

    return segments;
  }

  /**
   * Genera recomendaciones basadas en el análisis
   */
  private generateRecommendations(analysis: FootageAnalysis, input: LogosInput): string[] {
    const recommendations: string[] = [];

    // Recomendación de calidad
    if (analysis.avgQuality < 50) {
      recommendations.push('⚠️ La calidad promedio del footage es baja. Considera grabar tomas adicionales.');
    }

    // Recomendación de duración
    const totalDuration = analysis.clips.reduce((sum, c) => {
      const clip = input.clips.find(cl => cl.id === c.clipId);
      return sum + (clip?.duration || 0);
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