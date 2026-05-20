/**
 * Style Matcher - The Secret Sauce
 * Film Grain & Noise Injection para blend de assets IA + humanos
 */
import { StyleProfile, StyleMatchConfig } from './types';
import { VideoClip, ColorCorrection } from '../agents/types';
export declare class StyleMatcher {
    /**
     * Analiza un video existente para crear un perfil de estilo
     */
    analyzeSourceVideo(clip: VideoClip): StyleProfile;
    /**
     * Genera configuración de Color Correction para matching
     */
    generateMatchingConfig(profile: StyleProfile, config: StyleMatchConfig): ColorCorrection;
    /**
     * Aplica Film Grain & Noise Injection
     * Este es el "Secret Sauce" que hace que el contenido IA se mezcle perfectamente
     */
    applyFilmGrainInjection(baseProfile: StyleProfile, targetAssetId: string): FilmGrainConfig;
    /**
     * Calcula animación de grano (el grano real se mueve ligeramente)
     */
    private calculateGrainAnimation;
    /**
     * Genera un preset de color para aplicar a assets generados
     */
    generateLUTPreset(profile: StyleProfile): string;
    /**
     * Analiza varios clips y genera un perfil promedio
     */
    createAverageProfile(clips: VideoClip[]): StyleProfile;
    /**
     * Blendea colores para obtener el promedio
     */
    private BlendColors;
    /**
     * Perfil por defecto para videos sin análisis
     */
    getDefaultProfile(): StyleProfile;
    /**
     * Valida si un asset generado matchea con el estilo
     */
    validateMatch(assetProfile: StyleProfile, sourceProfile: StyleProfile, threshold?: number): MatchValidation;
}
export interface FilmGrainConfig {
    assetId: string;
    grainLevel: number;
    grainType: 'film' | 'digital' | 'none';
    grainAnimation: GrainAnimationConfig;
    colorAdjustment: {
        temperature: number;
        tint: number;
        shadows: number;
        highlights: number;
    };
    blendMode: 'overlay' | 'soft-light' | 'hard-light' | 'multiply';
    opacity: number;
}
export interface GrainAnimationConfig {
    enabled: boolean;
    speed: 'slow' | 'medium' | 'fast';
    intensity: number;
    pattern: 'random' | 'fixed' | 'noise';
    offsetVariation: number;
}
export interface MatchValidation {
    isMatch: boolean;
    score: number;
    issues: string[];
}
export default StyleMatcher;
