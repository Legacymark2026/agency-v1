/**
 * Audio Generator API Clients
 * ElevenLabs & Suno Integration
 */
export class ElevenLabsClient {
    constructor(apiKey) {
        this.baseUrl = 'https://api.elevenlabs.io/v1';
        this.apiKey = apiKey;
    }
    // Lista de voces disponibles
    async getVoices() {
        const response = await fetch(`${this.baseUrl}/voices`, {
            headers: { 'xi-api-key': this.apiKey }
        });
        return response.json();
    }
    // Text to Speech
    async generateSpeech(request) {
        const startTime = Date.now();
        try {
            const response = await fetch(`${this.baseUrl}/text-to-speech/${request.voiceId || '21m00Tcm4TlvDq8ikWAM'}`, {
                method: 'POST',
                headers: {
                    'xi-api-key': this.apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: request.text,
                    model_id: request.modelId || 'eleven_multilingual_v2',
                    voice_settings: request.settings || {
                        stability: 0.5,
                        similarity_boost: 0.75,
                        style: 0,
                        speaker_boost: true
                    }
                })
            });
            if (!response.ok) {
                const error = await response.text();
                throw new Error(`ElevenLabs API error: ${error}`);
            }
            // Convertir a blob
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            // Calcular duración aproximada (aprox 10 chars/segundo)
            const duration = request.text.length / 10;
            const asset = {
                id: `eleven-${Date.now()}`,
                projectId: '',
                sourceType: 'ai_generated',
                sourceProvider: 'elevenlabs',
                sourceUrl: audioUrl,
                prompt: request.text,
                duration,
                status: 'ready',
                cost: Math.ceil(request.text.length / 100) * 3, // ~3 créditos por 100 chars
                metadata: {
                    voiceId: request.voiceId,
                    modelId: request.modelId
                },
                createdAt: new Date()
            };
            return {
                success: true,
                asset,
                processingTime: Date.now() - startTime,
                cost: asset.cost
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                processingTime: Date.now() - startTime
            };
        }
    }
    // Clonar voz (requiere audio source)
    async cloneVoice(name, audioFileUrl) {
        // En producción, esto subiría el archivo de audio para clonar
        // Por ahora retornamos un placeholder
        return {
            voiceId: `cloned-${Date.now()}`
        };
    }
}
export class SunoClient {
    constructor(apiKey) {
        this.baseUrl = 'https://api.suno.ai/v1';
        this.apiKey = apiKey;
    }
    async generateMusic(request) {
        const startTime = Date.now();
        try {
            // NOTA: Esta es la estructura de llamada típica
            // La API real de Suno puede variar
            const response = await fetch(`${this.baseUrl}/generate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(Object.assign({ prompt: request.prompt, style: request.style || 'custom', duration: request.duration || 180, instrumental: request.instrumental || false }, (request.seed && { seed: request.seed })))
            });
            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Suno API error: ${error}`);
            }
            const data = await response.json();
            // En producción, polling del job hasta completar
            const asset = {
                id: `suno-${Date.now()}`,
                projectId: '',
                sourceType: 'ai_generated',
                sourceProvider: 'suno',
                sourceUrl: data.audio_url || data.url,
                thumbnailUrl: data.image_url || '',
                prompt: request.prompt,
                duration: request.duration || 180,
                status: 'generating', // Pode estar gerando
                cost: 10, // CREDIT_COSTS.suno
                metadata: {
                    jobId: data.id,
                    status: data.status
                },
                createdAt: new Date()
            };
            return {
                success: true,
                asset,
                processingTime: Date.now() - startTime,
                cost: 10
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                processingTime: Date.now() - startTime
            };
        }
    }
    async getJobStatus(jobId) {
        try {
            const response = await fetch(`${this.baseUrl}/jobs/${jobId}`, {
                headers: { 'Authorization': `Bearer ${this.apiKey}` }
            });
            return await response.json();
        }
        catch (error) {
            return { status: 'failed' };
        }
    }
}
// ============================================
// FACTORY
// ============================================
export function createAudioClient(provider, apiKey) {
    switch (provider) {
        case 'elevenlabs':
            return new ElevenLabsClient(apiKey);
        case 'suno':
            return new SunoClient(apiKey);
        default:
            throw new Error(`Unknown audio provider: ${provider}`);
    }
}
export default {
    ElevenLabsClient,
    SunoClient,
    createAudioClient
};
