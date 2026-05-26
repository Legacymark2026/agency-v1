"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllTransitionPresets = getAllTransitionPresets;
exports.getTransitionPresetById = getTransitionPresetById;
exports.getTransitionsByComplexity = getTransitionsByComplexity;
exports.suggestTransition = suggestTransition;
exports.autoSuggestAllTransitions = autoSuggestAllTransitions;
exports.analyzeClipForTransition = analyzeClipForTransition;
exports.getTransitionFFmpegFilter = getTransitionFFmpegFilter;
const TRANSITION_PRESETS = [
    {
        id: 'cross_dissolve',
        name: 'Disolvencia cruzada',
        type: 'dissolve',
        description: 'Transición suave entre clips con opacidad progresiva',
        defaultDuration: 0.5,
        tags: ['universal', 'suave', 'profesional'],
        complexity: 'simple',
        parameters: { softness: 0.3 },
    },
    {
        id: 'fade_to_black',
        name: 'Fundido a negro',
        type: 'fade',
        description: 'Fundido a negro entre escenas',
        defaultDuration: 1.0,
        tags: ['narrativo', 'dramático', 'cierre'],
        complexity: 'simple',
        parameters: { color: '#000000' },
    },
    {
        id: 'wipe_left',
        name: 'Cortinilla izquierda',
        type: 'wipe',
        description: 'Barrido horizontal de izquierda a derecha',
        defaultDuration: 0.4,
        tags: ['dinámico', 'moderno'],
        complexity: 'simple',
        parameters: { direction: 'left' },
    },
    {
        id: 'slide_up',
        name: 'Deslizamiento arriba',
        type: 'slide',
        description: 'El clip nuevo desliza desde abajo',
        defaultDuration: 0.5,
        tags: ['dinámico', 'moderno', 'presentación'],
        complexity: 'moderate',
        parameters: { direction: 'up', easing: 'ease-out' },
    },
    {
        id: 'zoom_in',
        name: 'Zoom in',
        type: 'zoom',
        description: 'Zoom hacia adentro en el nuevo clip',
        defaultDuration: 0.6,
        tags: ['énfasis', 'dramático', 'detalle'],
        complexity: 'moderate',
        parameters: { startScale: 1.5, endScale: 1.0 },
    },
    {
        id: 'glitch_digital',
        name: 'Glitch digital',
        type: 'glitch',
        description: 'Efecto de error digital con distorsión',
        defaultDuration: 0.3,
        tags: ['vintage', 'vaporwave', 'edgy'],
        complexity: 'complex',
        parameters: { intensity: 0.5, rgbSplit: 3 },
    },
    {
        id: 'light_leak',
        name: 'Fuga de luz',
        type: 'lightLeak',
        description: 'Lente con fuga de luz orgánica',
        defaultDuration: 0.6,
        tags: ['cinemático', 'cálido', 'orgánico'],
        complexity: 'complex',
        parameters: { color: '#FFD700', opacity: 0.4 },
    },
];
const TRANSITION_RULES = [
    {
        fromCondition: (m) => (m.averageLuminance ?? 0.5) < 0.3,
        toCondition: (m) => (m.averageLuminance ?? 0.5) > 0.7,
        recommendedTypes: ['fade', 'dissolve'],
        reason: 'Transición de oscuro a brillante',
        weight: 0.8,
    },
    {
        fromCondition: (m) => (m.motionIntensity ?? 0.5) > 0.7,
        toCondition: (m) => (m.motionIntensity ?? 0.5) < 0.3,
        recommendedTypes: ['dissolve', 'fade'],
        reason: 'Cambio de alta a baja energía',
        weight: 0.9,
    },
    {
        fromCondition: (m) => (m.motionIntensity ?? 0.5) > 0.7,
        toCondition: (m) => (m.motionIntensity ?? 0.5) > 0.7,
        recommendedTypes: ['slide', 'wipe', 'glitch'],
        reason: 'Alta energía en ambos clips',
        weight: 0.85,
    },
    {
        fromCondition: (m) => m.hasFace === true,
        toCondition: (m) => m.hasFace === false,
        recommendedTypes: ['dissolve', 'zoom'],
        reason: 'Transición desde rostro a paisaje/detalle',
        weight: 0.75,
    },
    {
        fromCondition: (m) => !!m.textOverlay,
        toCondition: () => true,
        recommendedTypes: ['dissolve', 'fade'],
        reason: 'Salida desde texto',
        weight: 0.7,
    },
    {
        fromCondition: () => true,
        toCondition: (m) => !!m.textOverlay,
        recommendedTypes: ['dissolve', 'zoom'],
        reason: 'Entrada a texto',
        weight: 0.7,
    },
    {
        fromCondition: (m) => m.scene === 'interview',
        toCondition: (m) => m.scene !== 'interview',
        recommendedTypes: ['dissolve'],
        reason: 'Transición desde entrevista',
        weight: 0.8,
    },
];
function generateTransitionId() {
    return `trans_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
function getAllTransitionPresets() {
    return TRANSITION_PRESETS;
}
function getTransitionPresetById(id) {
    return TRANSITION_PRESETS.find((p) => p.id === id);
}
function getTransitionsByComplexity(complexity) {
    return TRANSITION_PRESETS.filter((p) => p.complexity === complexity);
}
function suggestTransition(fromClip, toClip, options = {}) {
    const suggestions = [];
    const appliedTypes = new Set();
    for (const rule of TRANSITION_RULES) {
        if (rule.fromCondition(fromClip) && rule.toCondition(toClip)) {
            for (const type of rule.recommendedTypes) {
                if (options.preferredTypes &&
                    !options.preferredTypes.includes(type)) {
                    continue;
                }
                if (!appliedTypes.has(type)) {
                    appliedTypes.add(type);
                    suggestions.push({
                        id: generateTransitionId(),
                        type,
                        fromClip: fromClip.id,
                        toClip: toClip.id,
                        fromMetadata: fromClip,
                        toMetadata: toClip,
                        confidence: Math.round(rule.weight * 85 + 15),
                        reason: rule.reason,
                        duration: options.maxDuration
                            ? Math.min(TRANSITION_PRESETS.find((p) => p.type === type)
                                ?.defaultDuration ?? 0.5, options.maxDuration)
                            : TRANSITION_PRESETS.find((p) => p.type === type)
                                ?.defaultDuration ?? 0.5,
                        parameters: TRANSITION_PRESETS.find((p) => p.type === type)
                            ?.parameters,
                    });
                }
            }
        }
    }
    if (suggestions.length === 0) {
        suggestions.push({
            id: generateTransitionId(),
            type: 'dissolve',
            fromClip: fromClip.id,
            toClip: toClip.id,
            fromMetadata: fromClip,
            toMetadata: toClip,
            confidence: 70,
            reason: 'Transición por defecto — disolvencia suave',
            duration: options.maxDuration
                ? Math.min(0.5, options.maxDuration)
                : 0.5,
            parameters: { softness: 0.3 },
        });
    }
    return suggestions
        .sort((a, b) => b.confidence - a.confidence)
        .filter((s) => (options.minConfidence ? s.confidence >= options.minConfidence : true));
}
function autoSuggestAllTransitions(clips, options = {}) {
    const allSuggestions = [];
    for (let i = 0; i < clips.length - 1; i++) {
        const fromClip = clips[i];
        const toClip = clips[i + 1];
        const suggestions = suggestTransition(fromClip, toClip, options);
        allSuggestions.push(...suggestions);
    }
    return allSuggestions;
}
function analyzeClipForTransition(clipPath, clipId) {
    return Promise.resolve({
        id: clipId,
        duration: 0,
        averageLuminance: 0.5,
        dominantColors: ['#333333'],
        motionIntensity: 0.5,
        audioLevel: -20,
        hasFace: false,
        textOverlay: false,
    });
}
function getTransitionFFmpegFilter(type, duration, parameters) {
    switch (type) {
        case 'dissolve':
            return `fade=t=in:st=0:d=${duration},fade=t=out:st=${duration}:d=${duration}`;
        case 'fade':
            return `fade=t=in:st=0:d=${duration},color=c=${parameters?.color || '#000000'}:s=1920x1080:d=${duration}[fade];[0][fade]overlay`;
        case 'wipe': {
            const dir = parameters?.direction || 'left';
            return `wipe=w=1920:h=1080:d=${duration}:direction=${dir === 'left' ? 0 : 1}`;
        }
        case 'slide':
            return `slide=direction=${parameters?.direction === 'up' ? 1 : 0}:duration=${duration}`;
        case 'zoom':
            return `zoompan=z='if(lte(on,1),${parameters?.startScale || 1.5},${parameters?.endScale || 1.0})':d=${Math.round(duration * 30)}`;
        case 'glitch':
            return `geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':enable='lt(mod(t,${duration}),${duration * 0.3})'`;
        case 'lightLeak':
            return `colorchannelmixer=rr=${parameters?.opacity || 0.4}:rg=0.2:rb=0.1`;
        default:
            return `fade=t=in:st=0:d=${duration}`;
    }
}
//# sourceMappingURL=index.js.map