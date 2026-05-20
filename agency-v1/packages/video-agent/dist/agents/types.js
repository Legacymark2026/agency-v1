/**
 * Tipos base para el sistema de agentes de edición de video
 * The Editing Nexus - Video Agent System
 */
export const PLATFORM_SPECS = {
    tiktok: {
        safeZone: { minY: 0.15, maxY: 0.75, minX: 0.05, maxX: 0.95 },
        maxDuration: 180,
        aspectRatio: '9:16',
        recommendedResolutions: ['1080x1920', '720x1280'],
        audioStandardLUFS: -14
    },
    reels: {
        safeZone: { minY: 0.15, maxY: 0.75, minX: 0.1, maxX: 0.9 },
        maxDuration: 90,
        aspectRatio: '9:16',
        recommendedResolutions: ['1080x1920'],
        audioStandardLUFS: -14
    },
    youtube: {
        safeZone: { minY: 0.1, maxY: 0.9, minX: 0.05, maxX: 0.95 },
        maxDuration: 600,
        aspectRatio: '16:9',
        recommendedResolutions: ['1920x1080', '1280x720', '3840x2160'],
        audioStandardLUFS: -14
    },
    'instagram-feed': {
        safeZone: { minY: 0.1, maxY: 0.85, minX: 0.1, maxX: 0.9 },
        maxDuration: 60,
        aspectRatio: '4:5',
        recommendedResolutions: ['1080x1350', '1080x1080'],
        audioStandardLUFS: -14
    },
    facebook: {
        safeZone: { minY: 0.1, maxY: 0.85, minX: 0.05, maxX: 0.95 },
        maxDuration: 240,
        aspectRatio: '16:9',
        recommendedResolutions: ['1920x1080', '1280x720'],
        audioStandardLUFS: -14
    },
    multi: {
        safeZone: { minY: 0.15, maxY: 0.75, minX: 0.1, maxX: 0.9 },
        maxDuration: 60,
        aspectRatio: '9:16',
        recommendedResolutions: ['1080x1920'],
        audioStandardLUFS: -14
    }
};
export const STYLE_PRESETS = {
    cinematic: {
        cutsPerMinute: 12,
        transitionType: 'cut',
        colorLut: 'cinematic',
        textStyle: 'minimal',
        minClipDuration: 3,
        maxClipDuration: 10
    },
    viral: {
        cutsPerMinute: 30,
        transitionType: 'jump-cut',
        colorLut: 'pop',
        textStyle: 'animated',
        minClipDuration: 0.5,
        maxClipDuration: 3
    },
    corporate: {
        cutsPerMinute: 15,
        transitionType: 'fade',
        colorLut: 'clean',
        textStyle: 'static',
        minClipDuration: 2,
        maxClipDuration: 8
    },
    luxury: {
        cutsPerMinute: 8,
        transitionType: 'dissolve',
        colorLut: 'gold-premium',
        textStyle: 'elegant',
        minClipDuration: 4,
        maxClipDuration: 15
    },
    bohemian: {
        cutsPerMinute: 18,
        transitionType: 'dissolve',
        colorLut: 'warm-artisan',
        textStyle: 'handwritten',
        minClipDuration: 2,
        maxClipDuration: 6
    },
    custom: {
        cutsPerMinute: 15,
        transitionType: 'cut',
        colorLut: 'custom',
        textStyle: 'minimal',
        minClipDuration: 2,
        maxClipDuration: 8
    }
};
// PLATFORM_SPECS y STYLE_PRESETS se exportan arriba
