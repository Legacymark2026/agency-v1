export interface Clip {
  id: string;
  type: 'macro' | 'close-up' | 'branding' | 'hero' | 'b-roll' | 'transition';
  duration: number;
  resolution: string;
  fps: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  focus: 'sharp' | 'soft' | 'drifting';
  stability: 'stable' | 'slight-jitter' | 'unstable';
  lighting: 'dramatic' | 'natural' | 'artificial' | 'mixed';
  intention?: 'texture' | 'process' | 'reward' | 'hook' | 'branding';
  heroShot?: boolean;
  semanticTags: string[];
}

export interface AudioTrack {
  type: 'music' | 'voiceover' | 'sfx' | 'ambient';
  source: string;
  lufs: number;
  duration: number;
  bpm?: number;
}

export interface ProjectConfig {
  type: 'product-showcase' | 'educational' | 'brand-marketing' | 'viral' | 'documentary' | 'event' | 'hybrid';
  format: '9:16' | '16:9' | '4:5' | '1:1' | 'custom';
  style: 'cinematic' | 'viral' | 'corporate' | 'luxury' | 'bohemian' | 'custom';
  rhythm: 'fast' | 'medium' | 'cinematic';
  platform: 'tiktok' | 'reels' | 'youtube' | 'instagram-feed' | 'facebook' | 'multi';
  duration: number;
  hookDuration: number;
}

export interface TextOverlay {
  text: string;
  position: 'top' | 'center' | 'bottom' | 'custom';
  animation: 'fade' | 'slide' | 'typewriter' | 'none';
  font: string;
  color: string;
  safeZone: boolean;
  duration: number;
  startTime: number;
}

export interface ColorGrade {
  lut: string;
  temperature: number;
  tint: number;
  contrast: number;
  saturation: number;
  highlights: number;
  shadows: number;
  midtones: number;
}

export interface SpeedRamp {
  clipId: string;
  keyframes: { time: number; speed: number }[];
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

export interface SoundLayer {
  trackId: string;
  type: 'music' | 'voiceover' | 'sfx';
  fadeIn: number;
  fadeOut: number;
  duckingLevel?: number;
  duckingTrigger?: string;
}

export interface RenderOutput {
  filename: string;
  format: string;
  resolution: string;
  codec: string;
  audioBitrate: number;
}

export class VideoEditorModule {
  private clips: Clip[] = [];
  private audioTracks: AudioTrack[] = [];
  private config: ProjectConfig;
  private textOverlays: TextOverlay[] = [];
  private colorGrades: Map<string, ColorGrade> = new Map();
  private speedRamps: SpeedRamp[] = [];
  private soundLayers: SoundLayer[] = [];

  constructor(config: ProjectConfig) {
    this.config = config;
    this.initializeDefaults();
  }

  private initializeDefaults(): void {
    this.config.hookDuration = this.config.hookDuration || 3;
  }

  // ============================================
  // MODULO 1: ANALISIS DE BRUTO
  // ============================================

  analyzeFootage(clips: Clip[]): Map<string, any> {
    const analysis = new Map();

    clips.forEach(clip => {
      const score = this.calculateClipScore(clip);
      const heroShot = this.detectHeroShot(clip, clips);
      const intention = this.detectIntention(clip);

      analysis.set(clip.id, {
        score,
        heroShot,
        intention,
        recommendation: this.getRecommendation(score, heroShot)
      });
    });

    return analysis;
  }

  private calculateClipScore(clip: Clip): number {
    let score = 0;
    if (clip.quality === 'excellent') score += 30;
    else if (clip.quality === 'good') score += 20;
    else if (clip.quality === 'fair') score += 10;

    if (clip.focus === 'sharp') score += 20;
    else if (clip.focus === 'soft') score += 10;

    if (clip.stability === 'stable') score += 20;
    else if (clip.stability === 'slight-jitter') score += 10;

    if (clip.lighting === 'dramatic') score += 15;
    else if (clip.lighting === 'natural') score += 10;

    score += (clip.fps >= 60 ? 15 : 0);

    return Math.min(score, 100);
  }

  private detectHeroShot(clip: Clip, allClips: Clip[]): boolean {
    if (clip.intention === 'hook') return true;
    if (clip.type === 'hero' && clip.quality === 'excellent') return true;
    if (clip.semanticTags.includes('hero') || clip.semanticTags.includes('main')) return true;

    const avgScore = allClips.reduce((sum, c) => sum + this.calculateClipScore(c), 0) / allClips.length;
    return this.calculateClipScore(clip) > avgScore + 15;
  }

  private detectIntention(clip: Clip): string {
    if (clip.intention) return clip.intention;
    
    if (clip.type === 'macro' && clip.semanticTags.includes('falling')) return 'texture';
    if (clip.type === 'close-up' && clip.semanticTags.includes('process')) return 'process';
    if (clip.type === 'branding') return 'reward';
    if (clip.duration < 5) return 'hook';

    return 'general';
  }

  private getRecommendation(score: number, heroShot: boolean): string {
    if (heroShot && score > 70) return 'PRIORITY: Usar como Hero Shot';
    if (score > 60) return 'PRIMARY: Usar en timeline principal';
    if (score > 40) return 'SECONDARY: Usar como B-roll';
    return 'DISCARD: No suitable for final edit';
  }

  // ============================================
  // MODULO 2: ESTRATEGIA DE EDICION
  // ============================================

  generateTimeline(clips: Clip[]): any {
    const analysis = this.analyzeFootage(clips);
    
    const timeline = {
      hook: this.buildHookSegment(clips, analysis),
      body: this.buildBodySegment(clips, analysis),
      climax: this.buildClimaxSegment(clips, analysis),
      outro: this.buildOutroSegment()
    };

    return {
      segments: timeline,
      totalDuration: this.calculateTimelineDuration(timeline),
      cuts: this.countCuts(timeline),
      averageCutDuration: this.calculateAvgCutDuration(timeline)
    };
  }

  private buildHookSegment(clips: Clip[], analysis: Map<string, any>): any {
    const heroClips = clips.filter(c => analysis.get(c.id)?.heroShot);
    const hookClips = clips.filter(c => analysis.get(c.id)?.intention === 'hook');

    const selectedClip = hookClips[0] || heroClips[0] || clips[0];
    
    return {
      clips: [selectedClip],
      duration: this.config.hookDuration,
      type: 'hook',
      transitions: ['none'],
      speedRamp: { start: 30, end: 50, duration: this.config.hookDuration }
    };
  }

  private buildBodySegment(clips: Clip[], analysis: Map<string, any>): any {
    const processClips = clips.filter(c => 
      analysis.get(c.id)?.intention === 'process' || c.type === 'close-up'
    );

    const rhythm = this.config.rhythm === 'fast' ? 1.5 : 
                   this.config.rhythm === 'cinematic' ? 5 : 3;

    return {
      clips: processClips,
      duration: Math.max(processClips.length * rhythm, 6),
      type: 'body',
      transitions: processClips.map(() => 'cut'),
      speedRamping: true
    };
  }

  private buildClimaxSegment(clips: Clip[], analysis: Map<string, any>): any {
    const rewardClips = clips.filter(c => 
      analysis.get(c.id)?.intention === 'reward' || c.type === 'branding'
    );

    return {
      clips: rewardClips,
      duration: Math.max(rewardClips.length * 2.5, 4),
      type: 'climax',
      transitions: ['cut'],
      emphasis: true
    };
  }

  private buildOutroSegment(): any {
    return {
      clips: [],
      duration: 2,
      type: 'outro',
      transitions: ['fade'],
      fadeToBlack: true
    };
  }

  private calculateTimelineDuration(timeline: any): number {
    return timeline.hook.duration + timeline.body.duration + 
           timeline.climax.duration + timeline.outro.duration;
  }

  private countCuts(timeline: any): number {
    return timeline.hook.clips.length + timeline.body.clips.length + 
           timeline.climax.clips.length;
  }

  private calculateAvgCutDuration(timeline: any): number {
    const totalCuts = this.countCuts(timeline);
    const totalDuration = this.calculateTimelineDuration(timeline);
    return totalDuration / totalCuts;
  }

  // ============================================
  // MODULO 3: SPEED RAMPING
  // ============================================

  applySpeedRamping(clipId: string, config: { startSpeed: number; endSpeed: number; easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' }): SpeedRamp {
    const ramp: SpeedRamp = {
      clipId,
      keyframes: [
        { time: 0, speed: config.startSpeed },
        { time: 100, speed: config.endSpeed }
      ],
      easing: config.easing
    };

    this.speedRamps.push(ramp);
    return ramp;
  }

  // ============================================
  // MODULO 4: COLOR SCIENCE PRO
  // ============================================

  applyColorGrade(clipId: string, style: 'cinematic' | 'luxury' | 'viral' | 'corporate' | 'warm-artisan'): ColorGrade {
    const grades: Record<string, ColorGrade> = {
      'cinematic': {
        lut: 'Film-EM',
        temperature: 5600,
        tint: 5,
        contrast: 1.2,
        saturation: 0.9,
        highlights: -10,
        shadows: 15,
        midtones: 5
      },
      'luxury': {
        lut: 'Gold-Premium',
        temperature: 4500,
        tint: 10,
        contrast: 1.3,
        saturation: 0.85,
        highlights: -15,
        shadows: 20,
        midtones: 10
      },
      'viral': {
        lut: 'Pop-Culture',
        temperature: 6000,
        tint: 0,
        contrast: 1.1,
        saturation: 1.2,
        highlights: 0,
        shadows: 5,
        midtones: 0
      },
      'corporate': {
        lut: 'Clean-Pro',
        temperature: 5500,
        tint: 0,
        contrast: 1.05,
        saturation: 0.95,
        highlights: 0,
        shadows: 10,
        midtones: 0
      },
      'warm-artisan': {
        lut: 'Warm-Authentic',
        temperature: 4000,
        tint: 15,
        contrast: 1.25,
        saturation: 1.0,
        highlights: -5,
        shadows: 18,
        midtones: 8
      }
    };

    const grade = grades[style];
    this.colorGrades.set(clipId, grade);
    return grade;
  }

  // ============================================
  // MODULO 5: DISENO SONORO
  // ============================================

  configureAudioLayer(trackId: string, type: 'music' | 'voiceover' | 'sfx', config: { fadeIn?: number; fadeOut?: number; ducking?: number; trigger?: string }): SoundLayer {
    const layer: SoundLayer = {
      trackId,
      type,
      fadeIn: config.fadeIn || 0,
      fadeOut: config.fadeOut || 0,
      duckingLevel: config.ducking,
      duckingTrigger: config.trigger
    };

    this.soundLayers.push(layer);
    return layer;
  }

  generateAudioMix(tracks: AudioTrack[]): any {
    const music = tracks.find(t => t.type === 'music');
    const voice = tracks.find(t => t.type === 'voiceover');
    const sfx = tracks.filter(t => t.type === 'sfx');

    const mix = {
      masterLUFS: -14,
      layers: [] as any[],
      duckingSchedule: [] as any[]
    };

    if (music) {
      mix.layers.push({
        track: 'music',
        targetLUFS: -14,
        sidechain: voice ? true : false
      });
    }

    if (voice) {
      mix.layers.push({
        track: 'voice',
        targetLUFS: -16,
        duckingAmount: 0.2
      });
      
      if (music) {
        mix.duckingSchedule.push({
          trigger: 'voice-start',
          target: 'music',
          reduction: 20,
          attack: 0.05,
          release: 0.3
        });
      }
    }

    if (sfx.length > 0) {
      mix.layers.push({
        track: 'sfx',
        targetLUFS: -12,
        sidechain: false
      });
    }

    return mix;
  }

  // ============================================
  // MODULO 6: TEXT OVERLAYS & ZONAS SEGURAS
  // ============================================

  addTextOverlay(overlay: TextOverlay): TextOverlay {
    const safeZoneConfig = this.getSafeZoneConfig(this.config.format, this.config.platform);
    
    overlay.safeZone = this.validateSafeZone(overlay, safeZoneConfig);
    this.textOverlays.push(overlay);
    
    return overlay;
  }

  private getSafeZoneConfig(format: string, platform: string): { minY: number; maxY: number; minX: number; maxX: number } {
    const safeZones: Record<string, any> = {
      '9:16': {
        tiktok: { minY: 0.15, maxY: 0.75, minX: 0.1, maxX: 0.9 },
        reels: { minY: 0.15, maxY: 0.75, minX: 0.1, maxX: 0.9 },
        youtube: { minY: 0.1, maxY: 0.85, minX: 0.1, maxX: 0.9 }
      },
      '4:5': {
        instagram: { minY: 0.1, maxY: 0.85, minX: 0.1, maxX: 0.9 }
      },
      '16:9': {
        youtube: { minY: 0.05, maxY: 0.95, minX: 0.05, maxX: 0.95 }
      }
    };

    return safeZones[format]?.[platform] || { minY: 0.1, maxY: 0.9, minX: 0.1, maxX: 0.9 };
  }

  private validateSafeZone(overlay: TextOverlay, zone: { minY: number; maxY: number }): boolean {
    const positionMap = { top: 0.2, center: 0.5, bottom: 0.8, custom: 0.5 };
    const yPos = positionMap[overlay.position as keyof typeof positionMap] || 0.5;
    
    return yPos >= zone.minY && yPos <= zone.maxY;
  }

  generateTextAnimation(text: string, animation: 'fade' | 'slide' | 'typewriter' | 'none'): any {
    const animations: Record<string, any> = {
      fade: { type: 'opacity', keyframes: [{ time: 0, value: 0 }, { time: 0.3, value: 1 }] },
      slide: { type: 'transform', keyframes: [{ time: 0, value: { x: -50, y: 0 } }, { time: 0.3, value: { x: 0, y: 0 } }] },
      typewriter: { type: 'reveal', keyframes: [{ time: 0, value: '' }, { time: 0.05, value: text.charAt(0) }] },
      none: { type: 'static', keyframes: [] }
    };

    return animations[animation];
  }

  // ============================================
  // MODULO 7: VERIFICACION & CHECKLIST
  // ============================================

  runQualityChecklist(audioMix: any, timeline: any, colorGrades: Map<string, ColorGrade>, format: string, platform: string): { passed: boolean; issues: string[] } {
    const issues: string[] = [];

    if (audioMix.masterLUFS > -12 || audioMix.masterLUFS < -16) {
      issues.push(`Audio LUFS fuera de rango: ${audioMix.masterLUFS} (debe ser -14)`);
    }

    const colorConsistency = this.checkColorConsistency(colorGrades);
    if (!colorConsistency) {
      issues.push('Inconsistencia de color entre clips');
    }

    if (timeline.averageCutDuration < 1 && this.config.rhythm !== 'fast') {
      issues.push('Cortes muy rápidos para el estilo seleccionado');
    }

    const safeZoneCheck = this.checkSafeZones(this.textOverlays, format, platform);
    if (!safeZoneCheck.passed) {
      issues.push(`Texto fuera de zona segura: ${safeZoneCheck.issues.join(', ')}`);
    }

    if (timeline.segments.hook.clips.length === 0) {
      issues.push('Falta segmento de Hook en el timeline');
    }

    return {
      passed: issues.length === 0,
      issues
    };
  }

  private checkColorConsistency(grades: Map<string, ColorGrade>): boolean {
    if (grades.size <= 1) return true;
    
    const gradesArray = Array.from(grades.values());
    const referenceTemp = gradesArray[0].temperature;
    const tolerance = 500;

    return gradesArray.every(g => Math.abs(g.temperature - referenceTemp) <= tolerance);
  }

  private checkSafeZones(overlays: TextOverlay[], format: string, platform: string): { passed: boolean; issues: string[] } {
    const zone = this.getSafeZoneConfig(format, platform);
    const issues: string[] = [];

    overlays.forEach(o => {
      if (!o.safeZone) {
        issues.push(o.text);
      }
    });

    return { passed: issues.length === 0, issues };
  }

  // ============================================
  // MODULO 8: RENDER OUTPUT
  // ============================================

  generateRenderOutputs(): RenderOutput[] {
    const outputs: RenderOutput[] = [];
    const platformMap: Record<string, string[]> = {
      tiktok: ['9:16'],
      reels: ['9:16', '4:5'],
      youtube: ['16:9'],
      'instagram-feed': ['4:5', '1:1'],
      facebook: ['16:9', '1:1']
    };

    const formats = platformMap[this.config.platform] || ['9:16'];

    formats.forEach(format => {
      outputs.push({
        filename: `render_${this.config.type}_${format}.mp4`,
        format: 'mp4',
        resolution: format === '9:16' ? '1080x1920' : 
                   format === '4:5' ? '1080x1350' : 
                   format === '1:1' ? '1080x1080' : '1920x1080',
        codec: 'h264',
        audioBitrate: 192
      });
    });

    return outputs;
  }

  // ============================================
  // MODULO 9: VOZ EN OFF
  // ============================================

  generateVoiceoverScript(objective: string, tone: 'warm' | 'authoritative' | 'casual' | 'mysterious'): string {
    const scripts: Record<string, Record<string, string>> = {
      warm: {
        product: "No es solo un producto. Es una experiencia. Es tu momento.",
        brand: "Creamos algo especial para ti. Algo que mereces.",
        viral: "Esto va a cambiar tu perspectiva. Mira hasta el final."
      },
      authoritative: {
        product: "La calidad que buscas. El estándar que mereces.",
        brand: "Somos líderes en lo que hacemos. Esto es prueba de ello.",
        viral: "Los datos no mienten. Esto funciona. Mira los resultados."
      },
      casual: {
        product: "Ok, esto es lo que tienes que probar. En serio.",
        brand: "We made this for you. Hope you love it.",
        viral: "Wait for it... 🤯"
      },
      mysterious: {
        product: "Existe. Pero solo para quienes saben.",
        brand: "Lo que ves es solo el comienzo.",
        viral: "secretos que no puedes compartir..."
      }
    };

    return scripts[tone]?.[this.getScriptCategory(objective)] || "Tu mensaje aquí.";
  }

  private getScriptCategory(objective: string): string {
    if (objective.includes('product')) return 'product';
    if (objective.includes('brand') || objective.includes('marketing')) return 'brand';
    return 'viral';
  }

  // ============================================
  // EXPORT COMPLETO
  // ============================================

  exportProject(): any {
    return {
      config: this.config,
      timeline: this.generateTimeline(this.clips),
      colorGrades: Array.from(this.colorGrades.entries()),
      speedRamps: this.speedRamps,
      soundLayers: this.soundLayers,
      textOverlays: this.textOverlays,
      audioMix: this.audioTracks.length > 0 ? this.generateAudioMix(this.audioTracks) : null,
      qualityCheck: this.runQualityChecklist(
        this.generateAudioMix(this.audioTracks),
        this.generateTimeline(this.clips),
        this.colorGrades,
        this.config.format,
        this.config.platform
      ),
      outputs: this.generateRenderOutputs()
    };
  }

  addClips(clips: Clip[]): void {
    this.clips.push(...clips);
  }

  addAudioTracks(tracks: AudioTrack[]): void {
    this.audioTracks.push(...tracks);
  }
}

// ============================================
// FACTORY & USAGE EXAMPLE
// ============================================

export function createVideoProject(config: Partial<ProjectConfig>): VideoEditorModule {
  const defaultConfig: ProjectConfig = {
    type: 'product-showcase',
    format: '9:16',
    style: 'cinematic',
    rhythm: 'medium',
    platform: 'reels',
    duration: 20,
    hookDuration: 3
  };

  return new VideoEditorModule({ ...defaultConfig, ...config });
}

// ============================================
// SYSTEM PROMPT EMBEDDING
// ============================================

export const SYSTEM_PROMPT = `
Eres Lead Video Engineer & AI Content Architect.
Tu objetivo es gestionar el flujo completo de post-producción de video ultra-profesional.

MÓDULOS DE OPERACIÓN:
1. Análisis de Bruto: Clasificación por calidad, iluminación, encuadre, intención (Hero Shot detection)
2. Narrativa Algorítmica: Storyboard lógico basado en ritmo musical e intención del guion
3. Color Science Pro: Corrección primaria y grading avanzado (cinemático, comercial, luxury)
4. Diseño Sonoro: Normalización a -14 LUFS, limpieza de ruido, layering SFX

CONTROL HÍBRIDO:
- Modo Dictado: "Haz un match-cut aquí" → ajustar timeline
- Override Manual: Capacidad de abrir proyecto en capas para ajustes finos
- Iteración: Proponer 3 versiones (A: Cinemática, B: Viral, C: Informativa)

RECURSOS:
- B-Roll Inteligente, Motion Graphics, Subtítulos animados
- Pacing: Sincronización en beats de música, cortes cada 2-3 segundos

ZONAS SEGURAS (9:16):
- Texto entre 15%-75% verticalmente
- Evitar UI de TikTok/Reels (primeros 15% y últimos 25%)

CHECKLIST PRE-RENDER:
- Audio: -14 LUFS música, voz a -16 LUFS, ducking activo
- Color: Consistencia inter-cámara
- Transiciones: Narrativa, no decorativa
- Formato: Optimizado para plataforma destino
`;

export default VideoEditorModule;