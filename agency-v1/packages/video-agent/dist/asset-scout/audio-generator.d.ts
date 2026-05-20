/**
 * Audio Generator API Clients
 * ElevenLabs & Suno Integration
 */
import { GenerationResult } from './types';
export interface VoiceSettings {
    stability: number;
    similarity: number;
    style: number;
    speakerBoost: boolean;
}
export interface TTSRequest {
    text: string;
    voiceId?: string;
    modelId?: string;
    settings?: VoiceSettings;
}
export declare class ElevenLabsClient {
    private apiKey;
    private baseUrl;
    constructor(apiKey: string);
    getVoices(): Promise<any>;
    generateSpeech(request: TTSRequest): Promise<GenerationResult>;
    cloneVoice(name: string, audioFileUrl: string): Promise<{
        voiceId: string;
    }>;
}
export interface MusicGenerationRequest {
    prompt: string;
    style?: 'pop' | 'rock' | 'jazz' | 'classical' | 'electronic' | 'ambient' | 'custom';
    duration?: number;
    instrumental?: boolean;
    seed?: number;
}
export declare class SunoClient {
    private apiKey;
    private baseUrl;
    constructor(apiKey: string);
    generateMusic(request: MusicGenerationRequest): Promise<GenerationResult>;
    getJobStatus(jobId: string): Promise<{
        status: string;
        audioUrl?: string;
    }>;
}
export declare function createAudioClient(provider: 'elevenlabs' | 'suno', apiKey: string): ElevenLabsClient | SunoClient;
declare const _default: {
    ElevenLabsClient: typeof ElevenLabsClient;
    SunoClient: typeof SunoClient;
    createAudioClient: typeof createAudioClient;
};
export default _default;
