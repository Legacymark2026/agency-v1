'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { 
  VideoEditorModule, 
  Clip as BaseClip,
  AudioTrack as BaseAudioTrack,
  ProjectConfig as BaseProjectConfig,
  TextOverlay as BaseTextOverlay,
  ColorGrade as BaseColorGrade,
  SpeedRamp as BaseSpeedRamp,
  SoundLayer as BaseSoundLayer,
  Timeline as BaseTimeline,
  RenderOutput as BaseRenderOutput
} from '@agency/video-editor';

// ============================================
// EXTENDED TYPES FOR UI COMPATIBILITY
// ============================================

export type Clip = BaseClip;

export interface AudioTrack extends BaseAudioTrack {
  id?: string;
}

export interface ProjectConfig extends BaseProjectConfig {
  id?: string;
  name?: string;
}

export interface TextOverlay extends BaseTextOverlay {
  id: string;
}

export interface ColorGrade extends BaseColorGrade {
  clipId: string;
  style: 'cinematic' | 'luxury' | 'viral' | 'corporate' | 'warm-artisan';
}

export type SpeedRamp = BaseSpeedRamp;
export type SoundLayer = BaseSoundLayer;
export type Timeline = BaseTimeline;
export type RenderOutput = BaseRenderOutput;

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

export interface ClipAnalysis {
  clipId: string;
  score: number;
  heroShot: boolean;
  intention: string;
  recommendation: string;
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

export async function createVideoProject(data: Partial<VideoProject>): Promise<VideoProject> {
  const companyId = await getCompanyId();
  if (!companyId) throw new Error('Company not found');

  const project = await prisma.videoEditorProject.create({
    data: {
      companyId,
      name: data.name || 'Untitled',
      config: (data.config || {}) as any,
      clips: (data.clips || []) as any,
      audioTracks: (data.audioTracks || []) as any,
      textOverlays: (data.textOverlays || []) as any,
      colorGrades: (data.colorGrades || []) as any,
      speedRamps: (data.speedRamps || []) as any,
      soundLayers: (data.soundLayers || []) as any,
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
// DELEGATED LOGIC TO @agency/video-editor
// ============================================

// Helper to instantiate the module with default config if missing
function getEditor(config?: Partial<ProjectConfig>) {
  const defaultConfig: BaseProjectConfig = {
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

export async function analyzeFootage(clips: Clip[]): Promise<Map<string, ClipAnalysis>> {
  const editor = getEditor();
  const analysisRaw = editor.analyzeFootage(clips);
  
  // Transform the Map returned by VideoEditorModule to match the UI's expected Map shape
  const analysis = new Map<string, ClipAnalysis>();
  for (const [clipId, data] of analysisRaw.entries()) {
    analysis.set(clipId, {
      clipId,
      score: data.score,
      heroShot: data.heroShot,
      intention: data.intention,
      recommendation: data.recommendation
    });
  }
  return analysis;
}

export async function generateTimeline(clips: Clip[], config: ProjectConfig): Promise<Timeline> {
  const editor = getEditor(config);
  // generateTimeline calls analyzeFootage internally in the package
  return editor.generateTimeline(clips) as Timeline;
}

export async function applyColorGrade(clipId: string, style: 'cinematic' | 'luxury' | 'viral' | 'corporate' | 'warm-artisan'): Promise<ColorGrade> {
  const editor = getEditor();
  const grade = editor.applyColorGrade(clipId, style);
  return {
    clipId,
    style,
    ...grade
  };
}

export interface AudioMix {
  masterLUFS: number;
  layers: any[];
  duckingSchedule: any[];
}

export async function generateAudioMix(tracks: AudioTrack[]): Promise<AudioMix> {
  const editor = getEditor();
  return editor.generateAudioMix(tracks);
}

export async function generateVoiceoverScript(objective: string, tone: 'warm' | 'authoritative' | 'casual' | 'mysterious'): Promise<string> {
  const editor = getEditor();
  return editor.generateVoiceoverScript(objective, tone);
}

export async function runQualityCheck(audioMix: AudioMix, timeline: Timeline, colorGrades: ColorGrade[], config: ProjectConfig): Promise<{ passed: boolean; issues: string[] }> {
  const editor = getEditor(config);
  
  // Convert colorGrades to Map as expected by runQualityChecklist
  const gradesMap = new Map<string, BaseColorGrade>();
  colorGrades.forEach(g => gradesMap.set(g.clipId, g));

  return editor.runQualityChecklist(
    audioMix, 
    timeline, 
    gradesMap, 
    config.format || '9:16', 
    config.platform || 'reels'
  );
}

export async function generateRenderOutputs(config: ProjectConfig): Promise<RenderOutput[]> {
  const editor = getEditor(config);
  return editor.generateRenderOutputs() as RenderOutput[];
}