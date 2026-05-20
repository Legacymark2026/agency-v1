/**
 * Phonos Agent - Ingeniero de Audio
 * The Editing Nexus - Ingeniero de Audio
 *
 * Responsabilidades:
 * - Limpieza de ruido
 * - Normalización de audio (-14 LUFS)
 * - Audio ducking automático
 * - Mezcla de capas (música, voz, SFX)
 * - Sound design
 */
import { BaseAgent, AgentConfig } from './base';
import { AgentContext, AgentResult, AudioConfig, AudioMix } from './types';
export interface PhonosInput {
    audioConfig: AudioConfig;
    timelineDuration: number;
    hasVoiceover: boolean;
    platform: string;
    style: string;
}
export interface PhonosOutput {
    mix: AudioMix;
    recommendations: string[];
    soundDesign?: SoundDesignConfig;
}
export interface SoundDesignConfig {
    transitions: TransitionSound[];
    effects: SoundEffect[];
}
export interface TransitionSound {
    timestamp: number;
    type: 'whoosh' | 'impact' | 'sweep' | 'riser' | 'fall';
    duration: number;
    intensity: 'low' | 'medium' | 'high';
}
export interface SoundEffect {
    id: string;
    name: string;
    timestamp: number;
    duration: number;
    volume: number;
}
export declare class PhonosAgent extends BaseAgent<PhonosInput, PhonosOutput> {
    constructor(config?: AgentConfig);
    execute(context: AgentContext, input: PhonosInput): Promise<AgentResult<PhonosOutput>>;
    /**
     * Genera la configuración de mezcla de audio
     */
    private generateAudioMix;
    /**
     * Calcula el volumen de la música según el estilo
     */
    private calculateMusicVolume;
    /**
     * Configura las reglas de ducking
     */
    private configureDucking;
    /**
     * Genera configuración de sound design
     */
    private generateSoundDesign;
    /**
     * Genera recomendaciones de audio
     */
    private generateRecommendations;
}
export default PhonosAgent;
