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
    keyframes: {
        time: number;
        speed: number;
    }[];
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
export declare class VideoEditorModule {
    private clips;
    private audioTracks;
    private config;
    private textOverlays;
    private colorGrades;
    private speedRamps;
    private soundLayers;
    constructor(config: ProjectConfig);
    private initializeDefaults;
    analyzeFootage(clips: Clip[]): Map<string, any>;
    private calculateClipScore;
    private detectHeroShot;
    private detectIntention;
    private getRecommendation;
    generateTimeline(clips: Clip[]): any;
    private buildHookSegment;
    private buildBodySegment;
    private buildClimaxSegment;
    private buildOutroSegment;
    private calculateTimelineDuration;
    private countCuts;
    private calculateAvgCutDuration;
    applySpeedRamping(clipId: string, config: {
        startSpeed: number;
        endSpeed: number;
        easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
    }): SpeedRamp;
    applyColorGrade(clipId: string, style: 'cinematic' | 'luxury' | 'viral' | 'corporate' | 'warm-artisan'): ColorGrade;
    configureAudioLayer(trackId: string, type: 'music' | 'voiceover' | 'sfx', config: {
        fadeIn?: number;
        fadeOut?: number;
        ducking?: number;
        trigger?: string;
    }): SoundLayer;
    generateAudioMix(tracks: AudioTrack[]): any;
    addTextOverlay(overlay: TextOverlay): TextOverlay;
    private getSafeZoneConfig;
    private validateSafeZone;
    generateTextAnimation(text: string, animation: 'fade' | 'slide' | 'typewriter' | 'none'): any;
    runQualityChecklist(audioMix: any, timeline: any, colorGrades: Map<string, ColorGrade>, format: string, platform: string): {
        passed: boolean;
        issues: string[];
    };
    private checkColorConsistency;
    private checkSafeZones;
    generateRenderOutputs(): RenderOutput[];
    generateVoiceoverScript(objective: string, tone: 'warm' | 'authoritative' | 'casual' | 'mysterious'): string;
    private getScriptCategory;
    exportProject(): any;
    addClips(clips: Clip[]): void;
    addAudioTracks(tracks: AudioTrack[]): void;
}
export declare function createVideoProject(config: Partial<ProjectConfig>): VideoEditorModule;
export declare const SYSTEM_PROMPT = "\nEres Lead Video Engineer & AI Content Architect.\nTu objetivo es gestionar el flujo completo de post-producci\u00F3n de video ultra-profesional.\n\nM\u00D3DULOS DE OPERACI\u00D3N:\n1. An\u00E1lisis de Bruto: Clasificaci\u00F3n por calidad, iluminaci\u00F3n, encuadre, intenci\u00F3n (Hero Shot detection)\n2. Narrativa Algor\u00EDtmica: Storyboard l\u00F3gico basado en ritmo musical e intenci\u00F3n del guion\n3. Color Science Pro: Correcci\u00F3n primaria y grading avanzado (cinem\u00E1tico, comercial, luxury)\n4. Dise\u00F1o Sonoro: Normalizaci\u00F3n a -14 LUFS, limpieza de ruido, layering SFX\n\nCONTROL H\u00CDBRIDO:\n- Modo Dictado: \"Haz un match-cut aqu\u00ED\" \u2192 ajustar timeline\n- Override Manual: Capacidad de abrir proyecto en capas para ajustes finos\n- Iteraci\u00F3n: Proponer 3 versiones (A: Cinem\u00E1tica, B: Viral, C: Informativa)\n\nRECURSOS:\n- B-Roll Inteligente, Motion Graphics, Subt\u00EDtulos animados\n- Pacing: Sincronizaci\u00F3n en beats de m\u00FAsica, cortes cada 2-3 segundos\n\nZONAS SEGURAS (9:16):\n- Texto entre 15%-75% verticalmente\n- Evitar UI de TikTok/Reels (primeros 15% y \u00FAltimos 25%)\n\nCHECKLIST PRE-RENDER:\n- Audio: -14 LUFS m\u00FAsica, voz a -16 LUFS, ducking activo\n- Color: Consistencia inter-c\u00E1mara\n- Transiciones: Narrativa, no decorativa\n- Formato: Optimizado para plataforma destino\n";
export { VoiceNarrator, type ScriptNarrativeBlock, type NarrationResult } from './audio/voice-narrator.js';
export default VideoEditorModule;
