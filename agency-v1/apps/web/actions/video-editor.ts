'use server';

import { prisma as prismaDb } from '@/lib/prisma';
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
  RenderOutput as BaseRenderOutput
} from '@agency/video-editor';

const GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:8080';
async function gw(path: string, options: RequestInit = {}) {
  const res = await fetch(`${GATEWAY_URL}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } });
  if (!res.ok) { const err = await res.json().catch(() => ({ error: res.statusText })); throw new Error(err.error || `Gateway error ${res.status}`); }
  return res.json();
}

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
  aiTier?: 'prompt' | 'skill' | 'skill-chain' | 'agent' | 'agent-team';
  aiInstructions?: string;
  aiReferenceFiles?: { id: string; name: string; size: number; type: string }[];
}

export interface TextOverlay extends BaseTextOverlay {
  id: string;
}

export interface ColorGrade extends BaseColorGrade {
  clipId: string;
  style: 'cinematic' | 'luxury' | 'viral' | 'corporate' | 'warm-artisan';
}

export interface SpeedRamp {
  clipId: string;
  startSpeed?: number;
  endSpeed?: number;
  keyframes?: { time: number; speed: number }[];
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}
export type SoundLayer = BaseSoundLayer;
export type RenderOutput = BaseRenderOutput;

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
  
  const companyUser = await prismaDb.companyUser.findFirst({
    where: { userId: session.user.id },
    select: { companyId: true }
  });
  
  return companyUser?.companyId || null;
}

// ============================================
// PROJECTS CRUD
// ============================================

export async function createVideoProject(data: Partial<VideoProject>): Promise<VideoProject> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const companyId = await getCompanyId();
  if (!companyId) throw new Error('Company not found');

  return await gw('/api/video/projects', {
    method: 'POST',
    body: JSON.stringify({
      companyId,
      name: data.name,
      config: data.config,
      clips: data.clips,
      audioTracks: data.audioTracks,
      textOverlays: data.textOverlays,
      colorGrades: data.colorGrades,
      speedRamps: data.speedRamps,
      soundLayers: data.soundLayers,
    })
  });
}

export async function getVideoProjects(): Promise<VideoProject[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  const companyId = await getCompanyId();
  if (!companyId) return [];

  const res = await gw(`/api/video/projects?companyId=${companyId}`);
  return res.projects || [];
}

export async function getVideoProject(id: string): Promise<VideoProject | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const companyId = await getCompanyId();
  if (!companyId) return null;

  try {
    return await gw(`/api/video/projects/${id}?companyId=${companyId}`);
  } catch {
    return null;
  }
}

export async function updateVideoProject(id: string, data: Partial<VideoProject>): Promise<VideoProject> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const companyId = await getCompanyId();
  if (!companyId) throw new Error('Company not found');

  return await gw(`/api/video/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      ...data,
      companyId
    })
  });
}

export async function deleteVideoProject(id: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const companyId = await getCompanyId();
  if (!companyId) throw new Error('Company not found');

  await gw(`/api/video/projects/${id}?companyId=${companyId}`, {
    method: 'DELETE'
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

import { createCoordinator, initDatabase, CoordinatorInput } from '@agency/video-agent';

export async function generateTimeline(clips: Clip[], config: ProjectConfig): Promise<Timeline> {
  const editor = getEditor(config);
  // generateTimeline calls analyzeFootage internally in the package
  return editor.generateTimeline(clips) as Timeline;
}

export async function executeAIAgentWorkflow(projectId: string): Promise<any> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const companyId = await getCompanyId();
  if (!companyId) throw new Error('Company not found');

  const project = await getVideoProject(projectId);

  if (!project) throw new Error('Project not found');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

  // Initialize DB for the agent
  initDatabase(prismaDb as any);
  
  const coordinator = createCoordinator(companyId, apiKey);
  const config = project.config as unknown as ProjectConfig;

  const input: CoordinatorInput = {
    projectId: project.id,
    companyId: companyId,
    clips: project.clips as any[],
    audioUrl: '', // Could be taken from audioTracks
    outputFormat: config.format || '9:16',
    platform: (config.platform as any) || 'reels',
    style: (config.style as any) || 'cinematic',
    duration: config.duration || 20,
    hookDuration: config.hookDuration || 3,
  };

  // Execute full workflow (Logos, Croma, Phonos, Graphos)
  const result = await coordinator.executeFullWorkflow(input);

  // Parse result and adapt to frontend UI
  return {
    timeline: {
      segments: {
        hook: result.timeline.find((t: any) => t.type === 'hook') || { clips: [], duration: input.hookDuration, type: 'hook', transitions: [] },
        body: result.timeline.find((t: any) => t.type === 'body') || { clips: [], duration: input.duration - input.hookDuration, type: 'body', transitions: [] },
        climax: result.timeline.find((t: any) => t.type === 'climax') || { clips: [], duration: 3, type: 'climax', transitions: [] },
        outro: result.timeline.find((t: any) => t.type === 'outro') || { clips: [], duration: 2, type: 'outro', transitions: [] },
      },
      totalDuration: input.duration,
      cuts: result.timeline.reduce((acc: number, val: any) => acc + (val.clips?.length || 0), 0),
      averageCutDuration: 2.5
    },
    colorGrades: result.colorGrade,
    audioMix: result.audioMix,
    textOverlays: result.textOverlays,
    qualityCheck: result.qualityCheck
  };
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

import { SynthesisAgent } from '@agency/video-agent';

export async function runSynthesisAudit(projectId: string): Promise<any> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const companyId = await getCompanyId();
  if (!companyId) throw new Error('Company not found');

  const project = await getVideoProject(projectId);

  if (!project) throw new Error('Project not found');

  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) throw new Error('GEMINI_API_KEY is not configured');

  const config = project.config as unknown as ProjectConfig;

  const clipsMapped = ((project.clips as any[]) || []).map((c: any) => ({
    id: c.id,
    url: c.url || '',
    duration: c.duration || 5,
    resolution: c.resolution || '1920x1080',
    fps: c.fps || 30,
    tags: c.semanticTags || [],
    metadata: {
      quality: c.quality,
      focus: c.focus,
      stability: c.stability,
      lighting: c.lighting,
      intention: c.intention,
      heroShot: c.heroShot,
      semanticTags: c.semanticTags
    }
  }));

  let timelineSegments: any[] = [];
  if (project.timeline && (project.timeline as any).segments) {
    const segs = (project.timeline as any).segments;
    const order = ['hook', 'body', 'climax', 'outro'] as const;
    order.forEach(key => {
      const seg = segs[key];
      if (seg) {
        timelineSegments.push({
          id: key,
          type: key,
          clipIds: (seg.clips || []).map((c: any) => c.id),
          duration: seg.duration || 0,
          transitions: seg.transitions || ['none']
        });
      }
    });
  }

  const voiceoverTrack = ((project.audioTracks as any[]) || []).find((t: any) => t.type === 'voiceover');
  const voiceoverText = voiceoverTrack?.source || '';

  const synthesizer = new SynthesisAgent({
    projectId: project.id,
    companyId: companyId,
    clips: clipsMapped,
    timeline: timelineSegments,
    voiceover: voiceoverText,
    style: config.style || 'cinematic',
    platform: config.platform || 'reels',
    apiKeys: {
      pexels: process.env.PEXELS_API_KEY || 'dummy_pexels_key',
      midjourney: process.env.MIDJOURNEY_API_KEY || 'dummy_mj_key',
      elevenlabs: process.env.ELEVENLABS_API_KEY,
      suno: process.env.SUNO_API_KEY
    }
  });

  const audit = await synthesizer.runAudit(geminiApiKey);
  return JSON.parse(JSON.stringify(audit)); // Sanitize for client-side serialization
}

export async function approveSynthesisProposal(projectId: string, audit: any, proposalId: string): Promise<any> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const companyId = await getCompanyId();
  if (!companyId) throw new Error('Company not found');

  const project = await getVideoProject(projectId);

  if (!project) throw new Error('Project not found');

  const config = project.config as unknown as ProjectConfig;

  const clipsMapped = ((project.clips as any[]) || []).map((c: any) => ({
    id: c.id,
    url: c.url || '',
    duration: c.duration || 5,
    resolution: c.resolution || '1920x1080',
    fps: c.fps || 30,
    tags: c.semanticTags || [],
    metadata: {
      quality: c.quality,
      focus: c.focus,
      stability: c.stability,
      lighting: c.lighting,
      intention: c.intention,
      heroShot: c.heroShot,
      semanticTags: c.semanticTags
    }
  }));

  let timelineSegments: any[] = [];
  if (project.timeline && (project.timeline as any).segments) {
    const segs = (project.timeline as any).segments;
    const order = ['hook', 'body', 'climax', 'outro'] as const;
    order.forEach(key => {
      const seg = segs[key];
      if (seg) {
        timelineSegments.push({
          id: key,
          type: key,
          clipIds: (seg.clips || []).map((c: any) => c.id),
          duration: seg.duration || 0,
          transitions: seg.transitions || ['none']
        });
      }
    });
  }

  const voiceoverTrack = ((project.audioTracks as any[]) || []).find((t: any) => t.type === 'voiceover');
  const voiceoverText = voiceoverTrack?.source || '';

  const synthesizer = new SynthesisAgent({
    projectId: project.id,
    companyId: companyId,
    clips: clipsMapped,
    timeline: timelineSegments,
    voiceover: voiceoverText,
    style: config.style || 'cinematic',
    platform: config.platform || 'reels',
    apiKeys: {
      pexels: process.env.PEXELS_API_KEY || 'dummy_pexels_key',
      midjourney: process.env.MIDJOURNEY_API_KEY || 'dummy_mj_key',
      elevenlabs: process.env.ELEVENLABS_API_KEY,
      suno: process.env.SUNO_API_KEY
    }
  });

  const result = await synthesizer.approveProposal(proposalId, audit);
  return JSON.parse(JSON.stringify(result)); // Sanitize for client-side serialization
}