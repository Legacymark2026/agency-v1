'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

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
  id?: string;
  name: string;
  type: 'product-showcase' | 'educational' | 'brand-marketing' | 'viral' | 'documentary' | 'event' | 'hybrid';
  format: '9:16' | '16:9' | '4:5' | '1:1' | 'custom';
  style: 'cinematic' | 'viral' | 'corporate' | 'luxury' | 'bohemian' | 'custom';
  rhythm: 'fast' | 'medium' | 'cinematic';
  platform: 'tiktok' | 'reels' | 'youtube' | 'instagram-feed' | 'facebook' | 'multi';
  duration: number;
  hookDuration: number;
}

export interface TextOverlay {
  id: string;
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
  clipId: string;
  lut: string;
  temperature: number;
  tint: number;
  contrast: number;
  saturation: number;
  highlights: number;
  shadows: number;
  midtones: number;
  style: 'cinematic' | 'luxury' | 'viral' | 'corporate' | 'warm-artisan';
}

export interface SpeedRamp {
  clipId: string;
  startSpeed: number;
  endSpeed: number;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

export interface SoundLayer {
  trackId: string;
  type: 'music' | 'voiceover' | 'sfx';
  fadeIn: number;
  fadeOut: number;
  duckingLevel?: number;
}

export interface VideoProject {
  id: string;
  name: string;
  config: ProjectConfig;
  clips: Clip[];
  audioTracks: AudioTrack[];
  textOverlays: TextOverlay[];
  colorGrades: ColorGrade[];
  speedRamps: SpeedRamp[];
  soundLayers: SoundLayer[];
  timeline: any;
  qualityCheck: { passed: boolean; issues: string[] } | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimelineSegment {
  clips: Clip[];
  duration: number;
  type: 'hook' | 'body' | 'climax' | 'outro';
  transitions: string[];
  speedRamp?: any;
  emphasis?: boolean;
  fadeToBlack?: boolean;
}

export interface Timeline {
  segments: {
    hook: TimelineSegment;
    body: TimelineSegment;
    climax: TimelineSegment;
    outro: TimelineSegment;
  };
  totalDuration: number;
  cuts: number;
  averageCutDuration: number;
}

async function getCompanyId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  
  const companyUser = await prisma.companyUser.findFirst({
    where: { userId: session.user.id },
    select: { companyId: true }
  });
  
  return companyUser?.companyId || null;
}

// ============================================
// PROJECTS CRUD
// ============================================

export async function createVideoProject(config: ProjectConfig): Promise<VideoProject> {
  const companyId = await getCompanyId();
  if (!companyId) throw new Error('Company not found');

  const project = await prisma.videoEditorProject.create({
    data: {
      companyId,
      name: config.name,
      config: config as any,
      clips: [],
      audioTracks: [],
      textOverlays: [],
      colorGrades: [],
      speedRamps: [],
      soundLayers: [],
    }
  });

  return project as any;
}

export async function getVideoProjects(): Promise<VideoProject[]> {
  const companyId = await getCompanyId();
  if (!companyId) return [];

  const projects = await prisma.videoEditorProject.findMany({
    where: { companyId },
    orderBy: { updatedAt: 'desc' }
  });

  return projects as any;
}

export async function getVideoProject(id: string): Promise<VideoProject | null> {
  const companyId = await getCompanyId();
  if (!companyId) return null;

  const project = await prisma.videoEditorProject.findFirst({
    where: { id, companyId }
  });

  return project as any;
}

export async function updateVideoProject(id: string, data: Partial<VideoProject>): Promise<VideoProject> {
  const companyId = await getCompanyId();
  if (!companyId) throw new Error('Company not found');

  const project = await prisma.videoEditorProject.update({
    where: { id, companyId },
    data: {
      ...data,
      updatedAt: new Date()
    } as any
  });

  return project as any;
}

export async function deleteVideoProject(id: string): Promise<void> {
  const companyId = await getCompanyId();
  if (!companyId) throw new Error('Company not found');

  await prisma.videoEditorProject.delete({
    where: { id, companyId }
  });
}

// ============================================
// CLIP MANAGEMENT
// ============================================

export async function addClipsToProject(projectId: string, clips: Clip[]): Promise<VideoProject> {
  const project = await getVideoProject(projectId);
  if (!project) throw new Error('Project not found');

  const updatedClips = [...project.clips, ...clips];

  return await updateVideoProject(projectId, { clips: updatedClips });
}

export async function removeClipFromProject(projectId: string, clipId: string): Promise<VideoProject> {
  const project = await getVideoProject(projectId);
  if (!project) throw new Error('Project not found');

  const updatedClips = project.clips.filter(c => c.id !== clipId);

  return await updateVideoProject(projectId, { clips: updatedClips });
}

// ============================================
// ANALISIS DE FOOTAGE
// ============================================

export interface ClipAnalysis {
  clipId: string;
  score: number;
  heroShot: boolean;
  intention: string;
  recommendation: string;
}

export async function analyzeFootage(clips: Clip[]): Promise<Map<string, ClipAnalysis>> {
  const analysis = new Map<string, ClipAnalysis>();

  clips.forEach(clip => {
    const score = calculateClipScore(clip);
    const heroShot = detectHeroShot(clip, clips);
    const intention = detectIntention(clip);

    analysis.set(clip.id, {
      clipId: clip.id,
      score,
      heroShot,
      intention,
      recommendation: getRecommendation(score, heroShot)
    });
  });

  return analysis;
}

function calculateClipScore(clip: Clip): number {
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

function detectHeroShot(clip: Clip, allClips: Clip[]): boolean {
  if (clip.intention === 'hook') return true;
  if (clip.type === 'hero' && clip.quality === 'excellent') return true;
  if (clip.semanticTags.includes('hero') || clip.semanticTags.includes('main')) return true;

  const avgScore = allClips.reduce((sum, c) => sum + calculateClipScore(c), 0) / allClips.length;
  return calculateClipScore(clip) > avgScore + 15;
}

function detectIntention(clip: Clip): string {
  if (clip.intention) return clip.intention;
  
  if (clip.type === 'macro' && clip.semanticTags.includes('falling')) return 'texture';
  if (clip.type === 'close-up' && clip.semanticTags.includes('process')) return 'process';
  if (clip.type === 'branding') return 'reward';
  if (clip.duration < 5) return 'hook';

  return 'general';
}

function getRecommendation(score: number, heroShot: boolean): string {
  if (heroShot && score > 70) return 'PRIORITY: Usar como Hero Shot';
  if (score > 60) return 'PRIMARY: Usar en timeline principal';
  if (score > 40) return 'SECONDARY: Usar como B-roll';
  return 'DISCARD: No suitable for final edit';
}

// ============================================
// TIMELINE GENERATOR
// ============================================

export async function generateTimeline(clips: Clip[], config: ProjectConfig): Promise<Timeline> {
  const analysis = await analyzeFootage(clips);
  
  const hook = buildHookSegment(clips, analysis, config);
  const body = buildBodySegment(clips, analysis, config);
  const climax = buildClimaxSegment(clips, analysis);
  const outro = buildOutroSegment();

  return {
    segments: { hook, body, climax, outro },
    totalDuration: hook.duration + body.duration + climax.duration + outro.duration,
    cuts: hook.clips.length + body.clips.length + climax.clips.length,
    averageCutDuration: (hook.duration + body.duration + climax.duration) / (hook.clips.length + body.clips.length + climax.clips.length || 1)
  };
}

function buildHookSegment(clips: Clip[], analysis: Map<string, ClipAnalysis>, config: ProjectConfig): TimelineSegment {
  const heroClips = clips.filter(c => analysis.get(c.id)?.heroShot);
  const hookClips = clips.filter(c => analysis.get(c.id)?.intention === 'hook');

  const selectedClip = hookClips[0] || heroClips[0] || clips[0];
  
  return {
    clips: selectedClip ? [selectedClip] : [],
    duration: config.hookDuration || 3,
    type: 'hook',
    transitions: ['none'],
    speedRamp: { start: 30, end: 50, duration: config.hookDuration || 3 }
  };
}

function buildBodySegment(clips: Clip[], analysis: Map<string, ClipAnalysis>, config: ProjectConfig): TimelineSegment {
  const processClips = clips.filter(c => 
    analysis.get(c.id)?.intention === 'process' || c.type === 'close-up'
  );

  const rhythm = config.rhythm === 'fast' ? 1.5 : 
                 config.rhythm === 'cinematic' ? 5 : 3;

  return {
    clips: processClips,
    duration: Math.max(processClips.length * rhythm, 6),
    type: 'body',
    transitions: processClips.map(() => 'cut'),
    speedRamp: { start: 100, end: 100, duration: 0 }
  };
}

function buildClimaxSegment(clips: Clip[], analysis: Map<string, ClipAnalysis>): TimelineSegment {
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

function buildOutroSegment(): TimelineSegment {
  return {
    clips: [],
    duration: 2,
    type: 'outro',
    transitions: ['fade'],
    fadeToBlack: true
  };
}

// ============================================
// COLOR GRADING
// ============================================

export async function applyColorGrade(clipId: string, style: 'cinematic' | 'luxury' | 'viral' | 'corporate' | 'warm-artisan'): Promise<ColorGrade> {
  const grades: Record<string, Omit<ColorGrade, 'clipId' | 'style'>> = {
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

  return {
    clipId,
    style,
    ...grades[style]
  };
}

// ============================================
// AUDIO MIXER
// ============================================

export interface AudioMix {
  masterLUFS: number;
  layers: any[];
  duckingSchedule: any[];
}

export async function generateAudioMix(tracks: AudioTrack[]): Promise<AudioMix> {
  const music = tracks.find(t => t.type === 'music');
  const voice = tracks.find(t => t.type === 'voiceover');
  const sfx = tracks.filter(t => t.type === 'sfx');

  const mix: AudioMix = {
    masterLUFS: -14,
    layers: [],
    duckingSchedule: []
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

export async function generateVoiceoverScript(objective: string, tone: 'warm' | 'authoritative' | 'casual' | 'mysterious'): Promise<string> {
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

  const category = objective.includes('product') ? 'product' : 
                   objective.includes('brand') || objective.includes('marketing') ? 'brand' : 'viral';

  return scripts[tone]?.[category] || "Tu mensaje aquí.";
}

// ============================================
// QUALITY CHECKLIST
// ============================================

export async function runQualityCheck(audioMix: AudioMix, timeline: Timeline, colorGrades: ColorGrade[], config: ProjectConfig): Promise<{ passed: boolean; issues: string[] }> {
  const issues: string[] = [];

  if (audioMix.masterLUFS > -12 || audioMix.masterLUFS < -16) {
    issues.push(`Audio LUFS fuera de rango: ${audioMix.masterLUFS} (debe ser -14)`);
  }

  if (colorGrades.length > 1) {
    const temps = colorGrades.map(c => c.temperature);
    const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
    const hasInconsistency = temps.some(t => Math.abs(t - avgTemp) > 500);
    if (hasInconsistency) {
      issues.push('Inconsistencia de color entre clips');
    }
  }

  if (timeline.averageCutDuration < 1 && config.rhythm !== 'fast') {
    issues.push('Cortes muy rápidos para el estilo seleccionado');
  }

  if (timeline.segments.hook.clips.length === 0) {
    issues.push('Falta segmento de Hook en el timeline');
  }

  return {
    passed: issues.length === 0,
    issues
  };
}

// ============================================
// EXPORT
// ============================================

export interface RenderOutput {
  filename: string;
  format: string;
  resolution: string;
  codec: string;
  audioBitrate: number;
}

export async function generateRenderOutputs(config: ProjectConfig): Promise<RenderOutput[]> {
  const outputs: RenderOutput[] = [];
  const platformMap: Record<string, string[]> = {
    tiktok: ['9:16'],
    reels: ['9:16', '4:5'],
    youtube: ['16:9'],
    'instagram-feed': ['4:5', '1:1'],
    facebook: ['16:9', '1:1']
  };

  const formats = platformMap[config.platform] || ['9:16'];

  formats.forEach(format => {
    outputs.push({
      filename: `render_${config.type}_${format}.mp4`,
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