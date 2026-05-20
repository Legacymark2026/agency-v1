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
import { BaseAgent } from './base';
export class PhonosAgent extends BaseAgent {
    constructor(config) {
        super('phonos', config);
    }
    async execute(context, input) {
        const startTime = Date.now();
        this.clearLogs();
        try {
            this.log('info', `Starting Phonos audio engineering`, {
                hasVoiceover: input.hasVoiceover,
                duration: input.timelineDuration,
                platform: input.platform
            });
            // 1. Generar configuración de mezcla
            const mix = this.generateAudioMix(input);
            // 2. Configurar ducking automático
            const ducking = this.configureDucking(input);
            // 3. Añadir ducking a la mezcla
            mix.ducking = ducking;
            // 4. Generar sound design si es necesario
            const soundDesign = this.generateSoundDesign(input);
            // 5. Generar recomendaciones
            const recommendations = this.generateRecommendations(input, mix);
            this.log('info', `Phonos completed. Master LUFS: ${mix.masterLUFS}`, {
                layers: mix.layers.length,
                duckingRules: ducking.length
            });
            return {
                success: true,
                data: {
                    mix,
                    recommendations,
                    soundDesign
                },
                duration: Date.now() - startTime,
                logs: this.getLogs()
            };
        }
        catch (error) {
            this.log('error', `Phonos execution failed: ${error.message}`);
            return {
                success: false,
                error: error.message,
                duration: Date.now() - startTime,
                logs: this.getLogs()
            };
        }
    }
    /**
     * Genera la configuración de mezcla de audio
     */
    generateAudioMix(input) {
        const layers = [];
        let masterLUFS = -14; // Estándar para la mayoría de plataformas
        // 1. Música (base)
        if (input.audioConfig.music) {
            layers.push({
                track: 'music',
                volume: this.calculateMusicVolume(input.style),
                pan: 0,
                lufs: -16, // Un poco más baja para dejar espacio a la voz
                isMuted: false
            });
            this.log('debug', `Music layer configured`, { volume: layers[layers.length - 1].volume });
        }
        // 2. Voiceover (prioridad máxima)
        if (input.audioConfig.voiceover || input.hasVoiceover) {
            layers.push({
                track: 'voiceover',
                volume: 1.0,
                pan: 0,
                lufs: -16, // Voz más alta que música
                isMuted: false
            });
            this.log('debug', `Voiceover layer configured`, { lufs: -16 });
        }
        // 3. SFX (efectos de sonido)
        if (input.audioConfig.sfx && input.audioConfig.sfx.length > 0) {
            for (const sfx of input.audioConfig.sfx) {
                layers.push({
                    track: 'sfx',
                    volume: sfx.volume || 0.7,
                    pan: 0,
                    lufs: -12, // SFX un poco más altos para ser escuchados
                    isMuted: false
                });
            }
            this.log('debug', `SFX layer configured`, { count: input.audioConfig.sfx.length });
        }
        // 4. Ambient (opcional)
        if (input.audioConfig.ambient) {
            layers.push({
                track: 'ambient',
                volume: 0.3, // Ambiente suave
                pan: 0,
                lufs: -20,
                isMuted: false
            });
            this.log('debug', `Ambient layer configured`);
        }
        // Calcular LUFS master
        if (input.hasVoiceover) {
            // Si hay voz, el master puede ser un poco más alto
            masterLUFS = -13;
        }
        this.log('info', `Audio mix generated`, { layers: layers.length, masterLUFS });
        return {
            masterLUFS,
            dynamicRange: 6, // typical for speech/music mix
            layers
        };
    }
    /**
     * Calcula el volumen de la música según el estilo
     */
    calculateMusicVolume(style) {
        const volumes = {
            cinematic: 0.6,
            viral: 0.7,
            corporate: 0.5,
            luxury: 0.5,
            bohemian: 0.65,
            custom: 0.6
        };
        return volumes[style] || 0.6;
    }
    /**
     * Configura las reglas de ducking
     */
    configureDucking(input) {
        const duckingRules = [];
        // Ducking de música cuando hay voz
        if (input.hasVoiceover || input.audioConfig.voiceover) {
            duckingRules.push({
                trigger: 'voiceover',
                target: 'music',
                amount: 0.25, // Reducir 25% (-2.5dB aproximadamente)
                attack: 0.05, // 50ms attack
                release: 0.3 // 300ms release (suave)
            });
            this.log('debug', `Ducking configured: music -25% when voiceover present`);
        }
        // Ducking de música cuando hay SFX importantes
        if (input.audioConfig.sfx && input.audioConfig.sfx.length > 0) {
            duckingRules.push({
                trigger: 'sfx',
                target: 'music',
                amount: 0.15, // Reducir 15%
                attack: 0.02, // 20ms attack (rápido)
                release: 0.15 // 150ms release
            });
            this.log('debug', `Ducking configured: music -15% when SFX present`);
        }
        // Ducking adicional para música en momentos de alta energía (style-dependent)
        if (input.style === 'cinematic' || input.style === 'luxury') {
            duckingRules.push({
                trigger: 'voiceover',
                target: 'ambient',
                amount: 0.5, // Reducir ambient 50%
                attack: 0.1,
                release: 0.4
            });
            this.log('debug', `Ducking configured: ambient -50% when voiceover for cinematic style`);
        }
        return duckingRules;
    }
    /**
     * Genera configuración de sound design
     */
    generateSoundDesign(input) {
        // Solo generar sound design para estilos que lo requieran
        if (input.style === 'viral' || input.style === 'cinematic') {
            const transitions = [];
            const effects = [];
            // Generar efectos de transición cada ~5 segundos
            const transitionInterval = 5;
            const numTransitions = Math.floor(input.timelineDuration / transitionInterval);
            for (let i = 1; i < numTransitions; i++) {
                transitions.push({
                    timestamp: i * transitionInterval,
                    type: i % 2 === 0 ? 'whoosh' : 'sweep',
                    duration: 0.5,
                    intensity: input.style === 'viral' ? 'high' : 'medium'
                });
            }
            this.log('info', `Sound design generated`, {
                transitions: transitions.length,
                effects: effects.length
            });
            return { transitions, effects };
        }
        return undefined;
    }
    /**
     * Genera recomendaciones de audio
     */
    generateRecommendations(input, mix) {
        const recommendations = [];
        // Recomendación de volumen
        if (mix.masterLUFS > -12) {
            recommendations.push('⚠️ Master LUFS está alto. Considera reducir a -14 para evitar clipping.');
        }
        else if (mix.masterLUFS < -16) {
            recommendations.push('⚠️ Master LUFS está bajo. El audio sonará muy silencioso.');
        }
        // Recomendación de voz
        if (!input.hasVoiceover && !input.audioConfig.voiceover) {
            recommendations.push('💡 No se detectó voz. Considera añadir voiceover o locución para mayor engagement.');
        }
        // Recomendación de consistencia
        const musicLayer = mix.layers.find(l => l.track === 'music');
        if (musicLayer && musicLayer.lufs > -14) {
            recommendations.push('💡 La música está muy alta. Considera reducir para que la voz destaque más.');
        }
        // Recomendación de ducking
        if (input.hasVoiceover && (!mix.ducking || mix.ducking.length === 0)) {
            recommendations.push('⚠️ No hay ducking configurado. La música puede tapar la voz.');
        }
        // Recomendación de SFX
        if (input.style === 'viral' && (!input.audioConfig.sfx || input.audioConfig.sfx.length === 0)) {
            recommendations.push('💡 Para estilo viral, añade efectos de sonido en las transiciones para mayor impacto.');
        }
        // Recomendación de plataforma
        if (input.platform === 'youtube' && mix.masterLUFS !== -14) {
            recommendations.push(`💡 YouTube recomienda -14 LUFS. Tu configuración actual: ${mix.masterLUFS}`);
        }
        return recommendations;
    }
}
export default PhonosAgent;
