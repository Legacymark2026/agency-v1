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
import { 
  AgentContext, 
  AgentResult, 
  VideoClip, 
  VideoStyle,
  ColorGradeConfig,
  ColorCorrection,
  PrimaryCorrection,
  VideoProject
} from './types';

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

export class CromaAgent extends BaseAgent<CromaInput, CromaOutput> {
  constructor(config?: AgentConfig) {
    super('croma', config);
  }

  async execute(context: AgentContext, input: CromaInput): Promise<AgentResult<CromaOutput>> {
    const startTime = Date.now();
    this.clearLogs();

    try {
      this.log('info', `Starting Croma color grading for ${input.clips.length} clips`, { style: input.style });

      // 1. Analizar el footage para entender la iluminación y temperatura
      const colorAnalysis = await this.analyzeColor(input.clips);

      // 2. Generar corrección primaria para cada clip
      const corrections = await this.generatePrimaryCorrections(input.clips, colorAnalysis);

      // 3. Generar el color grading global según el estilo
      const globalGrade = this.generateGlobalGrade(input.style);

      // 4. Equalizar colores entre cámaras (si hay múltiples)
      await this.equalizeCameras(corrections, colorAnalysis);

      // 5. Generar recomendaciones
      const recommendations = this.generateRecommendations(input.style, colorAnalysis);

      this.log('info', `Croma completed: ${corrections.length} corrections applied`, {
        style: input.style,
        globalLUT: globalGrade.lut
      });

      return {
        success: true,
        data: {
          corrections,
          globalGrade,
          recommendations
        },
        duration: Date.now() - startTime,
        logs: this.getLogs()
      };

    } catch (error: any) {
      this.log('error', `Croma execution failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
        logs: this.getLogs()
      };
    }
  }

  /**
   * Analiza las características de color de cada clip
   */
  private async analyzeColor(clips: VideoClip[]): Promise<any> {
    const clipsData = clips.map(c => `
Clip ${c.id}:
- Resolución: ${c.resolution}
- FPS: ${c.fps}
- Iluminación (metadata): ${c.metadata?.lighting || 'unknown'}
- Tags: ${c.tags?.join(', ') || 'none'}
    `.trim()).join('\n\n');

    const prompt = `
Analiza los clips y determina las características de color para cada uno.
Devuelve un JSON con:

{
  "clips": [
    {
      "clipId": "id",
      "dominantColor": "warm|cool|neutral",
      "exposure": "under|balanced|over",
      "temperature": number (Kelvin estimado),
      "contrast": "low|medium|high",
      "needsCorrection": true|false,
      "issues": ["issue1", "issue2"]
    }
  ],
  "cameraConsistency": "high|medium|low",
  "overallTemperature": number,
  "avgExposure": "under|balanced|over"
}

Analiza: ${clipsData}`;

    const result = await this.callGeminiJson(prompt);
    this.log('info', `Color analysis complete for ${clips.length} clips`);
    
    return result;
  }

  /**
   * Genera correcciones primarias para cada clip
   */
  private async generatePrimaryCorrections(
    clips: VideoClip[], 
    analysis: any
  ): Promise<ColorCorrection[]> {
    const corrections: ColorCorrection[] = [];

    for (const clip of clips) {
      const clipAnalysis = analysis.clips?.find((c: any) => c.clipId === clip.id) || {};
      
      const primary: PrimaryCorrection = {
        // Exposure
        exposure: clipAnalysis.exposure === 'under' ? 0.5 : 
                  clipAnalysis.exposure === 'over' ? -0.3 : 0,
        
        // Contrast
        contrast: clipAnalysis.contrast === 'low' ? 1.1 : 
                  clipAnalysis.contrast === 'high' ? 0.9 : 1.0,
        
        // Highlights & Shadows
        highlights: clipAnalysis.exposure === 'over' ? -20 : 0,
        shadows: clipAnalysis.exposure === 'under' ? 15 : 0,
        
        // Whites & Blacks
        whites: 0,
        blacks: 0,
        
        // Temperature
        temperature: this.estimateTemperature(clipAnalysis.dominantColor, clipAnalysis.temperature),
        
        // Tint
        tint: 0,
        
        // Saturation
        saturation: 1.0
      };

      corrections.push({
        clipId: clip.id,
        primary,
        finalGrade: {
          lut: 'custom',
          temperature: primary.temperature,
          contrast: primary.contrast,
          saturation: primary.saturation,
          highlights: primary.highlights,
          shadows: primary.shadows
        }
      });

      this.log('debug', `Generated primary correction for clip ${clip.id}`, primary);
    }

    return corrections;
  }

  /**
   * Estima la temperatura basada en el análisis
   */
  private estimateTemperature(dominantColor: string, estimated?: number): number {
    if (estimated) return estimated;
    
    switch (dominantColor) {
      case 'warm': return 5500; // More orange/warm
      case 'cool': return 6500; // More blue/cool
      default: return 5600; // Daylight balanced
    }
  }

  /**
   * Genera el color grading global según el estilo
   */
  private generateGlobalGrade(style: VideoStyle): ColorGradeConfig {
    const presets: Record<VideoStyle, ColorGradeConfig> = {
      cinematic: {
        lut: 'Film-EM',
        temperature: 5600,
        tint: 5,
        contrast: 1.2,
        saturation: 0.9,
        highlights: -10,
        shadows: 15,
        midtones: 5,
        style: 'cinematic'
      },
      viral: {
        lut: 'Pop-Culture',
        temperature: 6000,
        tint: 0,
        contrast: 1.1,
        saturation: 1.2,
        highlights: 0,
        shadows: 5,
        midtones: 0,
        style: 'viral'
      },
      corporate: {
        lut: 'Clean-Pro',
        temperature: 5500,
        tint: 0,
        contrast: 1.05,
        saturation: 0.95,
        highlights: 0,
        shadows: 10,
        midtones: 0,
        style: 'corporate'
      },
      luxury: {
        lut: 'Gold-Premium',
        temperature: 4500,
        tint: 10,
        contrast: 1.3,
        saturation: 0.85,
        highlights: -15,
        shadows: 20,
        midtones: 10,
        style: 'luxury'
      },
      bohemian: {
        lut: 'Warm-Authentic',
        temperature: 4000,
        tint: 15,
        contrast: 1.15,
        saturation: 1.05,
        highlights: -5,
        shadows: 12,
        midtones: 8,
        style: 'bohemian'
      },
      custom: {
        lut: 'Custom-Grade',
        temperature: 5600,
        tint: 0,
        contrast: 1.0,
        saturation: 1.0,
        highlights: 0,
        shadows: 0,
        midtones: 0,
        style: 'custom'
      }
    };

    const grade = presets[style] || presets.cinematic;
    this.log('info', `Applied global grade for style: ${style}`, { lut: grade.lut });
    
    return grade;
  }

  /**
   * Equaliza los colores entre diferentes cámaras
   */
  private async equalizeCameras(corrections: ColorCorrection[], analysis: any): Promise<void> {
    if (analysis.cameraConsistency === 'high') {
      this.log('info', 'Camera consistency is high, no equalization needed');
      return;
    }

    // Si la consistencia es baja, ajustar la temperatura de todos los clips
    // para que coincidan con el clip de referencia (generalmente el de mayor calidad)
    const avgTemp = corrections.reduce((sum, c) => sum + c.primary.temperature, 0) / corrections.length;
    
    for (const correction of corrections) {
      const diff = correction.primary.temperature - avgTemp;
      if (Math.abs(diff) > 200) {
        // Ajuste menor para evitar looksdrastic
        correction.primary.temperature = avgTemp;
        this.log('debug', `Equalized clip ${correction.clipId} temperature to ${avgTemp}`);
      }
    }

    this.log('info', `Camera equalization applied. Avg temp: ${Math.round(avgTemp)}K`);
  }

  /**
   * Genera recomendaciones de color
   */
  private generateRecommendations(style: VideoStyle, analysis: any): string[] {
    const recommendations: string[] = [];

    // Recomendación de consistencia
    if (analysis.cameraConsistency === 'low') {
      recommendations.push('⚠️ Baja consistencia entre cámaras. Se aplicó equalización de temperatura.');
    }

    // Recomendación de exposición
    if (analysis.avgExposure === 'under') {
      recommendations.push('💡 El footage está subexpuesto. Considera levantar las sombras en post.');
    } else if (analysis.avgExposure === 'over') {
      recommendations.push('💡 El footage está sobreexpuesto. Considera recuperar highlights.');
    }

    // Recomendación de temperatura
    if (Math.abs(analysis.overallTemperature - 5600) > 500) {
      recommendations.push(`💡 Temperatura general: ${analysis.overallTemperature}K. Ajuste recomendado: 5600K.`);
    }

    // Recomendación de estilo
    if (style === 'luxury') {
      recommendations.push('💡 Estilo Luxury: Los dorados deben tener saturación moderada, no maxima.');
    }

    return recommendations;
  }
}

export default CromaAgent;