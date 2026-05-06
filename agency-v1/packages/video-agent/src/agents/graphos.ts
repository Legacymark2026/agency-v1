/**
 * Graphos Agent - Diseñador Gráfico y Motion Graphics
 * The Editing Nexus - Diseñador
 * 
 * Responsabilidades:
 * - Generación de subtítulos
 * - Validación de safe zones
 * - Motion graphics y animaciones
 * - Legibilidad y accesibilidad
 * - Lower thirds y CTAs
 */

import { BaseAgent, AgentConfig } from './base';
import { 
  AgentContext, 
  AgentResult, 
  TextOverlay,
  SafeZoneValidation,
  MotionGraphic,
  Platform,
  TimelineSegment,
  TextAnimation,
  TextPosition
} from './types';

export interface GraphosInput {
  timeline: TimelineSegment[];
  platform: Platform;
  style: string;
  voiceover?: string;
  branding?: {
    logo?: string;
    font?: string;
    colors?: string[];
  };
}

export interface GraphosOutput {
  textOverlays: TextOverlay[];
  motionGraphics: MotionGraphic[];
  safeZoneValidations: SafeZoneValidation[];
  recommendations: string[];
}

export class GraphosAgent extends BaseAgent<GraphosInput, GraphosOutput> {
  constructor(config?: AgentConfig) {
    super('graphos', config);
  }

  async execute(context: AgentContext, input: GraphosInput): Promise<AgentResult<GraphosOutput>> {
    const startTime = Date.now();
    this.clearLogs();

    try {
      this.log('info', `Starting Graphos design for ${input.platform}`, {
        segments: input.timeline.length,
        hasVoiceover: !!input.voiceover
      });

      // 1. Generar overlays de texto basándose en el timeline y voiceover
      const textOverlays = await this.generateTextOverlays(input);

      // 2. Generar motion graphics (lower thirds, etc.)
      const motionGraphics = this.generateMotionGraphics(input);

      // 3. Validar safe zones para cada overlay
      const safeZoneValidations = this.validateSafeZones(textOverlays, input.platform);

      // 4. Generar recomendaciones
      const recommendations = this.generateRecommendations(input, safeZoneValidations);

      this.log('info', `Graphos completed`, {
        textOverlays: textOverlays.length,
        motionGraphics: motionGraphics.length,
        safeZonesPassed: safeZoneValidations.filter(v => v.isValid).length
      });

      return {
        success: true,
        data: {
          textOverlays,
          motionGraphics,
          safeZoneValidations,
          recommendations
        },
        duration: Date.now() - startTime,
        logs: this.getLogs()
      };

    } catch (error: any) {
      this.log('error', `Graphos execution failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
        logs: this.getLogs()
      };
    }
  }

  /**
   * Genera los overlays de texto basándose en el timeline y voiceover
   */
  private async generateTextOverlays(input: GraphosInput): Promise<TextOverlay[]> {
    const overlays: TextOverlay[] = [];
    let currentTime = 0;

    // 1. Título inicial (hook)
    const hookSegment = input.timeline.find(s => s.type === 'hook');
    if (hookSegment) {
      const titleOverlay: TextOverlay = {
        id: `text-title-${Date.now()}`,
        text: this.extractTitle(input.voiceover),
        position: 'center',
        animation: 'fade',
        font: this.getFont(input.style),
        fontSize: this.getFontSize(input.platform, 'title'),
        color: '#FFFFFF',
        stroke: 'rgba(0,0,0,0.5)',
        shadow: { color: 'rgba(0,0,0,0.8)', blur: 4, offsetX: 2, offsetY: 2 },
        startTime: 0,
        duration: 3,
        approved: false
      };
      overlays.push(titleOverlay);
      this.log('debug', `Generated title overlay at 0s`);
    }

    // 2. Texto del hook
    if (hookSegment) {
      const hookTextOverlay: TextOverlay = {
        id: `text-hook-${Date.now()}`,
        text: this.extractHookText(input.voiceover),
        position: 'bottom',
        animation: 'slide',
        font: this.getFont(input.style),
        fontSize: this.getFontSize(input.platform, 'body'),
        color: '#FFFFFF',
        stroke: 'rgba(0,0,0,0.3)',
        startTime: 1,
        duration: 2,
        approved: false
      };
      overlays.push(hookTextOverlay);
    }

    // 3. Texto para el body (si hay voiceover)
    if (input.voiceover) {
      const bodySegments = input.timeline.filter(s => s.type === 'body');
      const voiceoverWords = input.voiceover.split(' ');
      const wordsPerSegment = Math.ceil(voiceoverWords.length / bodySegments.length);
      
      let wordIndex = 0;
      
      for (let i = 0; i < bodySegments.length; i++) {
        const segment = bodySegments[i];
        const segmentText = voiceoverWords.slice(wordIndex, wordIndex + wordsPerSegment).join(' ');
        
        if (segmentText.trim()) {
          const bodyOverlay: TextOverlay = {
            id: `text-body-${i}-${Date.now()}`,
            text: segmentText,
            position: 'bottom',
            animation: 'typewriter',
            font: this.getFont(input.style),
            fontSize: this.getFontSize(input.platform, 'body'),
            color: '#FFFFFF',
            startTime: segment.startTime || currentTime,
            duration: segment.duration / 2,
            approved: false
          };
          overlays.push(bodyOverlay);
        }
        
        wordIndex += wordsPerSegment;
        currentTime += segment.duration;
      }
    }

    // 4. CTA en outro
    const outroSegment = input.timeline.find(s => s.type === 'outro');
    if (outroSegment) {
      const ctaOverlay: TextOverlay = {
        id: `text-cta-${Date.now()}`,
        text: this.generateCTA(input.style),
        position: 'center',
        animation: 'bounce',
        font: this.getFont(input.style),
        fontSize: this.getFontSize(input.platform, 'cta'),
        fontWeight: 'bold',
        color: '#FFFFFF',
        stroke: 'rgba(0,0,0,0.5)',
        shadow: { color: 'rgba(0,0,0,0.8)', blur: 6, offsetX: 3, offsetY: 3 },
        startTime: (outroSegment as any).startTime || currentTime,
        duration: 2,
        approved: false
      };
      overlays.push(ctaOverlay);
      this.log('debug', `Generated CTA overlay at outro`);
    }

    // 5. Branding lower third (si aplica)
    if (input.branding?.logo) {
      const lowerThird: TextOverlay = {
        id: `text-brand-${Date.now()}`,
        text: input.branding.logo,
        position: 'bottom',
        animation: 'slide',
        font: this.getFont(input.style),
        fontSize: this.getFontSize(input.platform, 'brand'),
        color: '#FFFFFF',
        startTime: 0,
        duration: input.timeline.reduce((sum, s) => sum + s.duration, 0),
        approved: false
      };
      overlays.push(lowerThird);
    }

    this.log('info', `Generated ${overlays.length} text overlays`);

    return overlays;
  }

  /**
   * Genera motion graphics (lower thirds, transiciones, etc.)
   */
  private generateMotionGraphics(input: GraphosInput): MotionGraphic[] {
    const graphics: MotionGraphic[] = [];

    // Lower third para el segmento de body
    const bodySegments = input.timeline.filter(s => s.type === 'body');
    if (bodySegments.length > 0) {
      graphics.push({
        id: `motion-lowerthird-${Date.now()}`,
        type: 'lower-third',
        config: {
          position: 'bottom-left',
          animation: 'slide-in',
          duration: 0.5,
          style: input.style
        },
        layer: 1
      });
    }

    // Transiciones animadas para estilo viral
    if (input.style === 'viral') {
      const transitions = input.timeline.filter(s => s.transitions && s.transitions.length > 0);
      for (const transition of transitions) {
        graphics.push({
          id: `motion-transition-${transition.id}`,
          type: 'transition',
          config: {
            type: 'flash',
            duration: 0.3,
            intensity: 'high'
          },
          layer: 2
        });
      }
    }

    // CTA animado para outro
    graphics.push({
      id: `motion-cta-${Date.now()}`,
      type: 'CTA',
      config: {
        animation: 'pulse',
        duration: 1,
        style: input.style
      },
      layer: 3
    });

    this.log('info', `Generated ${graphics.length} motion graphics`);

    return graphics;
  }

  /**
   * Valida las safe zones para cada overlay
   */
  private validateSafeZones(overlays: TextOverlay[], platform: Platform): SafeZoneValidation[] {
    const validations: SafeZoneValidation[] = [];
    
    const platformBounds = this.getPlatformBounds(platform);

    for (const overlay of overlays) {
      // Calcular posición Y basada en position
      const yPosition = overlay.position === 'top' ? 0.15 :
                        overlay.position === 'bottom' ? 0.85 :
                        overlay.position === 'center' ? 0.5 : 0.5;

      const isValid = 
        yPosition >= platformBounds.minY && 
        yPosition <= platformBounds.maxY;

      const issues: string[] = [];
      
      if (yPosition < platformBounds.minY) {
        issues.push(`Texto demasiado arriba: ${(yPosition * 100).toFixed(1)}% (mínimo: ${(platformBounds.minY * 100).toFixed(1)}%)`);
      }
      if (yPosition > platformBounds.maxY) {
        issues.push(`Texto demasiado abajo: ${(yPosition * 100).toFixed(1)}% (máximo: ${(platformBounds.maxY * 100).toFixed(1)}%)`);
      }

      validations.push({
        isValid,
        platform,
        safeZoneBounds: platformBounds,
        actualPosition: { x: 0.5, y: yPosition },
        issues: issues.length > 0 ? issues : undefined
      });
    }

    const passedCount = validations.filter(v => v.isValid).length;
    this.log('info', `Safe zone validation: ${passedCount}/${validations.length} passed`);

    return validations;
  }

  /**
   * Obtiene los límites de safe zone por plataforma
   */
  private getPlatformBounds(platform: Platform): { minY: number; maxY: number; minX: number; maxX: number } {
    const bounds: Record<Platform, any> = {
      tiktok: { minY: 0.15, maxY: 0.75, minX: 0.05, maxX: 0.95 },
      reels: { minY: 0.15, maxY: 0.75, minX: 0.1, maxX: 0.9 },
      youtube: { minY: 0.1, maxY: 0.9, minX: 0.05, maxX: 0.95 },
      'instagram-feed': { minY: 0.1, maxY: 0.85, minX: 0.1, maxX: 0.9 },
      facebook: { minY: 0.1, maxY: 0.85, minX: 0.05, maxX: 0.95 },
      multi: { minY: 0.15, maxY: 0.75, minX: 0.1, maxX: 0.9 }
    };

    return bounds[platform] || bounds.reels;
  }

  /**
   * Obtiene la fuente según el estilo
   */
  private getFont(style: string): string {
    const fonts: Record<string, string> = {
      cinematic: 'Playfair Display',
      viral: 'Montserrat',
      corporate: 'Inter',
      luxury: 'Didot',
      bohemian: 'Lora',
      custom: 'Roboto'
    };
    return fonts[style] || 'Inter';
  }

  /**
   * Obtiene el tamaño de fuente según la plataforma
   */
  private getFontSize(platform: Platform, type: 'title' | 'body' | 'cta' | 'brand'): number {
    const sizes: Record<Platform, Record<string, number>> = {
      tiktok: { title: 32, body: 24, cta: 28, brand: 18 },
      reels: { title: 32, body: 24, cta: 28, brand: 18 },
      youtube: { title: 48, body: 32, cta: 40, brand: 24 },
      'instagram-feed': { title: 36, body: 26, cta: 30, brand: 20 },
      facebook: { title: 40, body: 28, cta: 34, brand: 22 },
      multi: { title: 32, body: 24, cta: 28, brand: 18 }
    };

    return sizes[platform]?.[type] || 24;
  }

  /**
   * Extrae el título del voiceover
   */
  private extractTitle(voiceover?: string): string {
    if (!voiceover) return 'Título';
    const firstSentence = voiceover.split('.')[0];
    return firstSentence.substring(0, 30) + (firstSentence.length > 30 ? '...' : '');
  }

  /**
   * Extrae el texto del hook
   */
  private extractHookText(voiceover?: string): string {
    if (!voiceover) return '';
    const sentences = voiceover.split('.');
    return sentences.slice(0, 2).join('. ').substring(0, 50);
  }

  /**
   * Genera el CTA según el estilo
   */
  private generateCTA(style: string): string {
    const ctas: Record<string, string> = {
      cinematic: 'Descubre más',
      viral: '👀 Mira el video completo',
      corporate: '了解更多',
      luxury: 'Exclusivo',
      bohemian: 'Explora más',
      custom: 'Ver más'
    };
    return ctas[style] || 'Ver más';
  }

  /**
   * Genera recomendaciones
   */
  private generateRecommendations(input: GraphosInput, validations: SafeZoneValidation[]): string[] {
    const recommendations: string[] = [];

    // Verificar safe zones
    const failedValidations = validations.filter(v => !v.isValid);
    if (failedValidations.length > 0) {
      recommendations.push(`⚠️ ${failedValidations.length} texto(s) fuera de safe zone. Ajustando automáticamente...`);
    }

    // Verificar presencia de texto
    if (!input.voiceover) {
      recommendations.push('💡 No hay voiceover. Considera añadir subtítulos guía o texto static.');
    }

    // Verificar cantidad de texto
    const textCount = input.timeline.length * 2; // estimación
    if (textCount > 10) {
      recommendations.push('💡 Mucho texto puede afectar la retención. Considera reducir overlays.');
    }

    // Estilo específico
    if (input.style === 'viral') {
      recommendations.push('💡 Estilo viral: Añade emojis o gráficos animados para mayor engagement.');
    }

    if (input.style === 'luxury') {
      recommendations.push('💡 Estilo Luxury: Usa animaciones sutiles y fuentes elegantes.');
    }

    return recommendations;
  }
}

export default GraphosAgent;