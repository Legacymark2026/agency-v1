/**
 * Style Matcher - The Secret Sauce
 * Film Grain & Noise Injection para blend de assets IA + humanos
 */
export class StyleMatcher {
    /**
     * Analiza un video existente para crear un perfil de estilo
     */
    analyzeSourceVideo(clip) {
        // En producción, esto analizaría el video frame por frame
        // Para el MVP, usamos los metadatos disponibles o valores por defecto
        const lightingMap = {
            'dramatic': 3500,
            'natural': 5600,
            'artificial': 4500,
            'mixed': 5000
        };
        const qualityGrainMap = {
            'excellent': 15,
            'good': 25,
            'fair': 40,
            'poor': 60
        };
        // Extraer propiedades del clip (algunos campos pueden no existir)
        const lighting = clip.lighting || 'natural';
        const quality = clip.quality || 'good';
        const profile = {
            sourceVideoId: clip.id,
            averageColor: '#D4A574', // Tono promedio
            temperature: lightingMap[lighting] || 5600,
            contrast: 1.2,
            saturation: 1.0,
            grainLevel: qualityGrainMap[quality] || 20,
            grainType: 'film'
        };
        return profile;
    }
    /**
     * Genera configuración de Color Correction para matching
     */
    generateMatchingConfig(profile, config) {
        const correction = {
            clipId: '',
            primary: {
                exposure: 0,
                contrast: config.matchContrast ? (profile.contrast - 1) * 100 : 0,
                highlights: 0,
                shadows: 0,
                whites: 0,
                blacks: 0,
                temperature: config.matchTemperature ? profile.temperature - 5600 : 0,
                tint: 0,
                saturation: config.matchSaturation ? (profile.saturation - 1) * 100 : 0
            }
        };
        return correction;
    }
    /**
     * Aplica Film Grain & Noise Injection
     * Este es el "Secret Sauce" que hace que el contenido IA se mezcle perfectamente
     */
    applyFilmGrainInjection(baseProfile, targetAssetId) {
        return {
            assetId: targetAssetId,
            grainLevel: baseProfile.grainLevel,
            grainType: baseProfile.grainType,
            grainAnimation: this.calculateGrainAnimation(baseProfile.grainLevel),
            colorAdjustment: {
                temperature: baseProfile.temperature,
                tint: 0,
                shadows: baseProfile.grainLevel > 30 ? 5 : 0, // Más grano = más sombras
                highlights: baseProfile.grainLevel < 20 ? -3 : 0 // Menos grano = más highlights
            },
            blendMode: 'overlay',
            opacity: Math.min(baseProfile.grainLevel / 100, 0.4)
        };
    }
    /**
     * Calcula animación de grano (el grano real se mueve ligeramente)
     */
    calculateGrainAnimation(level) {
        return {
            enabled: level > 10,
            speed: level > 30 ? 'fast' : level > 15 ? 'medium' : 'slow',
            intensity: level / 100,
            pattern: 'random', // Patrón de ruido
            offsetVariation: 0.3 // Variación de posición
        };
    }
    /**
     * Genera un preset de color para aplicar a assets generados
     */
    generateLUTPreset(profile) {
        // Mapear perfil a nombre de LUT
        if (profile.temperature < 4500)
            return 'warm-golden-hour';
        if (profile.temperature > 6000)
            return 'cool-blue-hour';
        if (profile.contrast > 1.3)
            return 'cinematic-high-contrast';
        if (profile.saturation > 1.1)
            return 'vibrant-pop';
        return 'neutral-cinematic';
    }
    /**
     * Analiza varios clips y genera un perfil promedio
     */
    createAverageProfile(clips) {
        if (clips.length === 0) {
            return this.getDefaultProfile();
        }
        const profiles = clips.map(c => this.analyzeSourceVideo(c));
        // Promediar valores
        const avgTemp = profiles.reduce((sum, p) => sum + p.temperature, 0) / profiles.length;
        const avgContrast = profiles.reduce((sum, p) => sum + p.contrast, 0) / profiles.length;
        const avgSaturation = profiles.reduce((sum, p) => sum + p.saturation, 0) / profiles.length;
        const avgGrain = profiles.reduce((sum, p) => sum + p.grainLevel, 0) / profiles.length;
        // Color promedio (dominante)
        const dominantColors = profiles.map(p => p.averageColor);
        const avgColor = this.BlendColors(dominantColors);
        return {
            averageColor: avgColor,
            temperature: avgTemp,
            contrast: avgContrast,
            saturation: avgSaturation,
            grainLevel: avgGrain,
            grainType: 'film'
        };
    }
    /**
     * Blendea colores para obtener el promedio
     */
    BlendColors(colors) {
        // Simplified color blending
        if (colors.length === 0)
            return '#FFFFFF';
        return colors[Math.floor(colors.length / 2)]; // Return middle color
    }
    /**
     * Perfil por defecto para videos sin análisis
     */
    getDefaultProfile() {
        return {
            averageColor: '#FFFFFF',
            temperature: 5600,
            contrast: 1.0,
            saturation: 1.0,
            grainLevel: 0,
            grainType: 'none'
        };
    }
    /**
     * Valida si un asset generado matchea con el estilo
     */
    validateMatch(assetProfile, sourceProfile, threshold = 0.8) {
        const tempDiff = Math.abs(assetProfile.temperature - sourceProfile.temperature);
        const contrastDiff = Math.abs(assetProfile.contrast - sourceProfile.contrast);
        const grainDiff = Math.abs(assetProfile.grainLevel - sourceProfile.grainLevel);
        const matchScore = 1 - ((tempDiff / 2000) * 0.3 + // 30% peso en temperatura
            (contrastDiff) * 0.3 + // 30% peso en contraste
            (grainDiff / 100) * 0.4 // 40% peso en grano
        );
        return {
            isMatch: matchScore >= threshold,
            score: matchScore,
            issues: [
                tempDiff > 500 ? `Temperatura: ${Math.round(tempDiff)}K diferencia` : null,
                contrastDiff > 0.2 ? `Contraste: ${contrastDiff.toFixed(2)} diferencia` : null,
                grainDiff > 20 ? `Grano: ${grainDiff}% diferencia` : null
            ].filter(Boolean)
        };
    }
}
export default StyleMatcher;
