export interface VideoTemplate {
    id: string;
    name: string;
    description: string;
    category: 'social' | 'marketing' | 'educational' | 'corporate' | 'entertainment';
    config: TemplateConfig;
    timeline: TemplateTimeline;
    defaults: TemplateDefaults;
}
export interface TemplateConfig {
    format: '16:9' | '9:16' | '1:1' | '4:5';
    style: string;
    platform: string;
    fps: number;
    quality: 'draft' | 'standard' | 'high';
}
export interface TemplateTimeline {
    hookDuration: number;
    bodyDuration: number;
    climaxDuration: number;
    outroDuration: number;
    transitionStyle: 'fade' | 'cut' | 'zoom' | 'glitch' | 'wipe';
    pacing: 'slow' | 'medium' | 'fast' | 'dynamic';
}
export interface TemplateDefaults {
    colorGrade: string;
    audioMix: {
        musicVolume: number;
        voiceVolume: number;
        sfxVolume: number;
        ducking: boolean;
    };
    textOverlays: TextOverlayPreset[];
}
export interface TextOverlayPreset {
    id: string;
    type: 'subtitle' | 'title' | 'lower_third' | 'call_to_action';
    fontFamily: string;
    fontSize: number;
    color: string;
    position: string;
    animation: string;
}
export declare const VIDEO_TEMPLATES: VideoTemplate[];
export declare function getTemplateById(id: string): VideoTemplate | undefined;
export declare function getTemplatesByCategory(category: string): VideoTemplate[];
export declare function applyTemplate(templateId: string, overrides?: Partial<VideoTemplate>): VideoTemplate | null;
export declare function getAllTemplates(): VideoTemplate[];
