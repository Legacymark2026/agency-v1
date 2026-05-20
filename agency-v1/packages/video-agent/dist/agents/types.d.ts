/**
 * Tipos base para el sistema de agentes de edición de video
 * The Editing Nexus - Video Agent System
 */
export type AgentName = 'logos' | 'croma' | 'phonos' | 'graphos';
export type AgentStatus = 'idle' | 'running' | 'completed' | 'failed' | 'pending';
export interface AgentResult<T> {
    success: boolean;
    data?: T;
    error?: string;
    duration: number;
    logs?: AgentLog[];
}
export interface AgentLog {
    timestamp: Date;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    metadata?: Record<string, any>;
}
export interface AgentContext {
    projectId: string;
    companyId: string;
    userId?: string;
    sessionId?: string;
}
export interface VideoClip {
    id: string;
    url: string;
    duration: number;
    resolution: string;
    fps: number;
    thumbnail?: string;
    tags?: string[];
    metadata?: ClipMetadata;
}
export interface ClipMetadata {
    quality?: 'excellent' | 'good' | 'fair' | 'poor';
    focus?: 'sharp' | 'soft' | 'drifting';
    stability?: 'stable' | 'slight-jitter' | 'unstable';
    lighting?: 'dramatic' | 'natural' | 'artificial' | 'mixed';
    intention?: 'hook' | 'texture' | 'process' | 'reward' | 'branding';
    heroShot?: boolean;
    semanticTags?: string[];
}
export interface VideoProject {
    id: string;
    companyId: string;
    name: string;
    description?: string;
    clips: VideoClip[];
    audioUrl?: string;
    outputFormat: OutputFormat;
    platform: Platform;
    style: VideoStyle;
    duration: number;
    hookDuration: number;
    status: ProjectStatus;
    timeline?: TimelineSegment[];
    colorGrade?: ColorGradeConfig;
    voiceover?: string;
    textOverlays?: TextOverlay[];
    manualOverrides?: ManualOverride[];
    agentLogs?: AgentExecutionLog[];
    commandHistory?: CommandHistoryEntry[];
    metadata?: ProjectMetadata;
    createdAt: Date;
    updatedAt: Date;
}
export type OutputFormat = '9:16' | '16:9' | '4:5' | '1:1' | 'custom';
export type Platform = 'tiktok' | 'reels' | 'youtube' | 'instagram-feed' | 'facebook' | 'multi';
export type VideoStyle = 'cinematic' | 'viral' | 'corporate' | 'luxury' | 'bohemian' | 'custom';
export type ProjectStatus = 'draft' | 'processing' | 'analyzing' | 'editing' | 'review' | 'completed' | 'failed';
export interface TimelineSegment {
    id: string;
    type: SegmentType;
    clipIds: string[];
    duration: number;
    transitions: TransitionType[];
    effects?: SegmentEffect[];
    metadata?: SegmentMetadata;
    startTime?: number;
}
export type SegmentType = 'hook' | 'body' | 'climax' | 'outro' | 'b-roll' | 'transition';
export type TransitionType = 'cut' | 'fade' | 'dissolve' | 'match-cut' | 'jump-cut' | 'whip' | 'none';
export interface SegmentEffect {
    type: EffectType;
    config: Record<string, any>;
}
export type EffectType = 'speed-ramp' | 'color' | 'text' | 'transition' | 'blur' | 'zoom';
export interface SegmentMetadata {
    beatSync?: boolean;
    bpm?: number;
    energy?: 'low' | 'medium' | 'high';
}
export interface ColorGradeConfig {
    lut?: string;
    temperature?: number;
    tint?: number;
    contrast?: number;
    saturation?: number;
    highlights?: number;
    shadows?: number;
    midtones?: number;
    style?: VideoStyle;
}
export interface ColorCorrection {
    clipId: string;
    primary: PrimaryCorrection;
    secondary?: SecondaryCorrection[];
    finalGrade?: ColorGradeConfig;
}
export interface PrimaryCorrection {
    exposure: number;
    contrast: number;
    highlights: number;
    shadows: number;
    whites: number;
    blacks: number;
    temperature: number;
    tint: number;
    saturation: number;
}
export interface SecondaryCorrection {
    color: string;
    hue: number;
    saturation: number;
    luminance: number;
    qualifier: 'reds' | 'oranges' | 'yellows' | 'greens' | 'cyans' | 'blues' | 'purples' | 'magentas';
}
export interface AudioConfig {
    music?: AudioTrack;
    voiceover?: AudioTrack;
    sfx?: AudioTrack[];
    ambient?: AudioTrack;
}
export interface AudioTrack {
    url: string;
    type: AudioType;
    duration: number;
    startTime?: number;
    fadeIn?: number;
    fadeOut?: number;
    volume?: number;
    lufs?: number;
}
export type AudioType = 'music' | 'voiceover' | 'sfx' | 'ambient';
export interface AudioMix {
    masterLUFS: number;
    dynamicRange: number;
    layers: AudioLayer[];
    ducking?: AudioDucking[];
}
export interface AudioLayer {
    track: AudioType;
    volume: number;
    pan?: number;
    lufs: number;
    isMuted?: boolean;
}
export interface AudioDucking {
    trigger: AudioType;
    target: AudioType;
    amount: number;
    attack: number;
    release: number;
}
export interface TextOverlay {
    id: string;
    text: string;
    position: TextPosition;
    animation: TextAnimation;
    font: string;
    fontSize?: number;
    fontWeight?: string;
    color: string;
    stroke?: string;
    shadow?: TextShadow;
    startTime: number;
    duration: number;
    approved: boolean;
    safeZone?: SafeZoneValidation;
}
export type TextPosition = 'top' | 'center' | 'bottom' | 'custom';
export type TextAnimation = 'fade' | 'slide' | 'typewriter' | 'bounce' | 'wave' | 'none' | 'scale';
export interface TextShadow {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
}
export interface SafeZoneValidation {
    isValid: boolean;
    platform: Platform;
    safeZoneBounds: {
        minY: number;
        maxY: number;
        minX: number;
        maxX: number;
    };
    actualPosition: {
        x: number;
        y: number;
    };
    issues?: string[];
}
export interface MotionGraphic {
    id: string;
    type: MotionType;
    config: Record<string, any>;
    layer: number;
}
export type MotionType = 'lower-third' | 'title-card' | 'transition' | 'emoji' | 'sticker' | 'CTA';
export interface EditorCommand {
    id: string;
    rawInput: string;
    agent: AgentName;
    action: string;
    parameters: CommandParameters;
    timestamp: Date;
    status: CommandStatus;
    result?: CommandResult;
    error?: string;
}
export type CommandStatus = 'pending' | 'parsing' | 'routing' | 'executing' | 'completed' | 'failed';
export interface CommandParameters {
    [key: string]: any;
}
export interface CommandResult {
    data?: any;
    message: string;
    changes?: CommandChange[];
}
export interface CommandChange {
    type: string;
    before: any;
    after: any;
    description: string;
}
export interface PostMetadata {
    id: string;
    projectId: string;
    platform: Platform;
    title: string;
    description: string;
    hashtags: string[];
    suggestedCTA: string;
    bestTimeToPost: string;
    seoKeywords: string[];
    generatedAt: Date;
}
export interface ProjectMetadata {
    analysis?: FootageAnalysis;
    versions?: EditVersion[];
    exportConfig?: ExportConfig;
    qualityCheck?: QualityCheckResult;
}
export interface FootageAnalysis {
    clips: ClipAnalysis[];
    heroShot?: string;
    totalDuration: number;
    avgQuality: number;
}
export interface ClipAnalysis {
    clipId: string;
    quality: number;
    intention: string;
    recommendation: string;
    energyLevel: 'low' | 'medium' | 'high';
    recommendedFor: string[];
}
export interface ExportConfig {
    format: OutputFormat;
    resolution: string;
    codec: string;
    audioBitrate: number;
    frameRate: number;
}
export interface QualityCheckResult {
    passed: boolean;
    score: number;
    issues: QualityIssue[];
    warnings: string[];
    checkedAt: Date;
}
export interface QualityIssue {
    type: 'audio' | 'video' | 'text' | 'color' | 'format';
    severity: 'critical' | 'major' | 'minor';
    description: string;
    location?: string;
    suggestion?: string;
}
export interface EditVersion {
    id: string;
    projectId: string;
    version: VersionType;
    name: string;
    description: string;
    timeline: TimelineSegment[];
    thumbnail?: string;
    status: VersionStatus;
    createdAt: Date;
    updatedAt: Date;
}
export type VersionType = 'A' | 'B' | 'C';
export type VersionStatus = 'draft' | 'preview' | 'approved' | 'rejected';
export interface ManualOverride {
    id: string;
    segmentId?: string;
    type: OverrideType;
    instruction: string;
    status: OverrideStatus;
    appliedAt?: Date;
    appliedBy?: string;
    result?: any;
}
export type OverrideType = 'cut' | 'transition' | 'color' | 'text' | 'speed' | 'audio' | 'timeline' | 'effect';
export type OverrideStatus = 'pending' | 'approved' | 'applied' | 'rejected' | 'cancelled';
export interface CommandHistoryEntry {
    id: string;
    command: string;
    agentName: AgentName;
    timestamp: Date;
    status: CommandStatus;
    success: boolean;
}
export interface AgentExecutionLog {
    agentName: AgentName;
    status: AgentStatus;
    startedAt: Date;
    completedAt?: Date;
    duration?: number;
    input?: any;
    output?: any;
    error?: string;
    logs: AgentLog[];
}
export interface PlatformSpec {
    safeZone: {
        minY: number;
        maxY: number;
        minX: number;
        maxX: number;
    };
    maxDuration: number;
    aspectRatio: string;
    recommendedResolutions: string[];
    audioStandardLUFS: number;
}
export declare const PLATFORM_SPECS: Record<Platform, PlatformSpec>;
export declare const STYLE_PRESETS: Record<VideoStyle, {
    cutsPerMinute: number;
    transitionType: TransitionType;
    colorLut: string;
    textStyle: string;
    minClipDuration: number;
    maxClipDuration: number;
}>;
export interface VideoDbInterface {
    integrationConfig: {
        findUnique: (args: {
            where: {
                companyId_provider: {
                    companyId: string;
                    provider: string;
                };
            };
        }) => Promise<any>;
    };
    videoProject: {
        create: (args: {
            data: any;
        }) => Promise<any>;
        findUnique: (args: {
            where: {
                id: string;
            };
            include?: any;
        }) => Promise<any>;
        update: (args: {
            where: {
                id: string;
            };
            data: any;
        }) => Promise<any>;
        findMany: (args: {
            where: any;
            orderBy?: any;
            take?: number;
            include?: any;
        }) => Promise<any[]>;
        delete: (args: {
            where: {
                id: string;
            };
        }) => Promise<any>;
    };
    editVersion: {
        create: (args: {
            data: any;
        }) => Promise<any>;
        update: (args: {
            where: {
                id: string;
            };
            data: any;
        }) => Promise<any>;
    };
    workflowStep: {
        create: (args: {
            data: any;
        }) => Promise<any>;
    };
}
export interface CoordinatorInput {
    projectId: string;
    companyId: string;
    clips: VideoClip[];
    audioUrl?: string;
    outputFormat: string;
    platform: Platform;
    style: VideoStyle;
    duration: number;
    hookDuration: number;
    voiceover?: string;
}
