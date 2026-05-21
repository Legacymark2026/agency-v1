"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VIDEO_TEMPLATES = void 0;
exports.getTemplateById = getTemplateById;
exports.getTemplatesByCategory = getTemplatesByCategory;
exports.applyTemplate = applyTemplate;
exports.getAllTemplates = getAllTemplates;
exports.VIDEO_TEMPLATES = [
    {
        id: 'tiktok_dynamic',
        name: 'TikTok Dinámico',
        description: 'Video vertical con cortes rápidos, subtítulos animados y alta energía',
        category: 'social',
        config: {
            format: '9:16',
            style: 'viral',
            platform: 'tiktok',
            fps: 30,
            quality: 'high',
        },
        timeline: {
            hookDuration: 3,
            bodyDuration: 12,
            climaxDuration: 5,
            outroDuration: 3,
            transitionStyle: 'zoom',
            pacing: 'dynamic',
        },
        defaults: {
            colorGrade: 'viral',
            audioMix: {
                musicVolume: -18,
                voiceVolume: -3,
                sfxVolume: -12,
                ducking: true,
            },
            textOverlays: [
                {
                    id: 'subtitle_main',
                    type: 'subtitle',
                    fontFamily: 'Montserrat',
                    fontSize: 48,
                    color: '#FFFFFF',
                    position: 'bottom',
                    animation: 'typewriter',
                },
                {
                    id: 'hook_text',
                    type: 'title',
                    fontFamily: 'Montserrat',
                    fontSize: 64,
                    color: '#FFD700',
                    position: 'center',
                    animation: 'slide_up',
                },
            ],
        },
    },
    {
        id: 'reels_cinematic',
        name: 'Reels Cinematográfico',
        description: 'Video vertical elegante con transiciones suaves y color grading cinematográfico',
        category: 'social',
        config: {
            format: '9:16',
            style: 'cinematic',
            platform: 'reels',
            fps: 24,
            quality: 'high',
        },
        timeline: {
            hookDuration: 4,
            bodyDuration: 20,
            climaxDuration: 6,
            outroDuration: 5,
            transitionStyle: 'fade',
            pacing: 'medium',
        },
        defaults: {
            colorGrade: 'cinematic',
            audioMix: {
                musicVolume: -20,
                voiceVolume: -3,
                sfxVolume: -15,
                ducking: true,
            },
            textOverlays: [
                {
                    id: 'subtitle_elegant',
                    type: 'subtitle',
                    fontFamily: 'Playfair Display',
                    fontSize: 42,
                    color: '#F5F5F5',
                    position: 'bottom',
                    animation: 'fade',
                },
            ],
        },
    },
    {
        id: 'youtube_standard',
        name: 'YouTube Standard',
        description: 'Video horizontal profesional para YouTube con estructura clásica',
        category: 'educational',
        config: {
            format: '16:9',
            style: 'corporate',
            platform: 'youtube',
            fps: 30,
            quality: 'high',
        },
        timeline: {
            hookDuration: 10,
            bodyDuration: 120,
            climaxDuration: 20,
            outroDuration: 15,
            transitionStyle: 'cut',
            pacing: 'medium',
        },
        defaults: {
            colorGrade: 'corporate',
            audioMix: {
                musicVolume: -22,
                voiceVolume: -3,
                sfxVolume: -14,
                ducking: true,
            },
            textOverlays: [
                {
                    id: 'title_main',
                    type: 'title',
                    fontFamily: 'Inter',
                    fontSize: 56,
                    color: '#FFFFFF',
                    position: 'center',
                    animation: 'fade',
                },
                {
                    id: 'lower_third',
                    type: 'lower_third',
                    fontFamily: 'Inter',
                    fontSize: 32,
                    color: '#FFFFFF',
                    position: 'bottom_left',
                    animation: 'slide_right',
                },
            ],
        },
    },
    {
        id: 'product_showcase',
        name: 'Product Showcase',
        description: 'Video cuadrado elegante para mostrar productos con estilo luxury',
        category: 'marketing',
        config: {
            format: '1:1',
            style: 'luxury',
            platform: 'instagram',
            fps: 30,
            quality: 'high',
        },
        timeline: {
            hookDuration: 3,
            bodyDuration: 15,
            climaxDuration: 7,
            outroDuration: 5,
            transitionStyle: 'wipe',
            pacing: 'slow',
        },
        defaults: {
            colorGrade: 'luxury',
            audioMix: {
                musicVolume: -16,
                voiceVolume: -3,
                sfxVolume: -10,
                ducking: false,
            },
            textOverlays: [
                {
                    id: 'product_name',
                    type: 'title',
                    fontFamily: 'Cormorant Garamond',
                    fontSize: 52,
                    color: '#D4AF37',
                    position: 'center',
                    animation: 'fade',
                },
            ],
        },
    },
    {
        id: 'corporate_presentation',
        name: 'Presentación Corporativa',
        description: 'Video profesional para presentaciones empresariales',
        category: 'corporate',
        config: {
            format: '16:9',
            style: 'corporate',
            platform: 'linkedin',
            fps: 30,
            quality: 'high',
        },
        timeline: {
            hookDuration: 5,
            bodyDuration: 45,
            climaxDuration: 10,
            outroDuration: 10,
            transitionStyle: 'fade',
            pacing: 'slow',
        },
        defaults: {
            colorGrade: 'corporate',
            audioMix: {
                musicVolume: -24,
                voiceVolume: -2,
                sfxVolume: -16,
                ducking: true,
            },
            textOverlays: [
                {
                    id: 'company_title',
                    type: 'title',
                    fontFamily: 'Inter',
                    fontSize: 48,
                    color: '#0A2540',
                    position: 'center',
                    animation: 'fade',
                },
                {
                    id: 'cta_button',
                    type: 'call_to_action',
                    fontFamily: 'Inter',
                    fontSize: 36,
                    color: '#FFFFFF',
                    position: 'bottom_center',
                    animation: 'slide_up',
                },
            ],
        },
    },
];
function getTemplateById(id) {
    return exports.VIDEO_TEMPLATES.find(t => t.id === id);
}
function getTemplatesByCategory(category) {
    return exports.VIDEO_TEMPLATES.filter(t => t.category === category);
}
function applyTemplate(templateId, overrides) {
    const template = getTemplateById(templateId);
    if (!template)
        return null;
    if (!overrides)
        return template;
    return {
        ...template,
        config: { ...template.config, ...(overrides.config || {}) },
        timeline: { ...template.timeline, ...(overrides.timeline || {}) },
        defaults: { ...template.defaults, ...(overrides.defaults || {}) },
    };
}
function getAllTemplates() {
    return exports.VIDEO_TEMPLATES;
}
//# sourceMappingURL=index.js.map