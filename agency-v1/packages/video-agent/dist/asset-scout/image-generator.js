/**
 * Image Generator API Clients
 * Midjourney & DALL-E Integration
 */
// ============================================
// CONFIGURACIÓN GLOBAL
// ============================================
const API_TIMEOUT = 60000; // 60 segundos
async function fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);
    try {
        const response = await fetch(url, Object.assign(Object.assign({}, options), { signal: controller.signal }));
        clearTimeout(timeout);
        return response;
    }
    catch (error) {
        clearTimeout(timeout);
        throw error;
    }
}
// ============================================
// MIDJOURNEY CLIENT
// ============================================
export class MidjourneyClient {
    constructor(apiKey) {
        this.baseUrl = 'https://api.midjourney.com/v1';
        this.apiKey = apiKey;
    }
    async generateImage(request) {
        const startTime = Date.now();
        try {
            // Configurar prompt según plataforma
            const fullPrompt = this.buildPrompt(request);
            // NOTA: La API real de Midjourney requiere implementación específica
            // Este es un ejemplo de la estructura de llamada
            const response = await fetchWithTimeout(`${this.baseUrl}/imagine`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: fullPrompt,
                    width: request.width,
                    height: request.height,
                    seed: request.seed,
                    // negative_prompt: request.negativePrompt
                })
            });
            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Midjourney API error: ${error}`);
            }
            const data = await response.json();
            // Crear asset
            const asset = {
                id: `mj-${Date.now()}`,
                projectId: '',
                sourceType: 'ai_generated',
                sourceProvider: 'midjourney',
                sourceUrl: data.image_url || data.uri,
                thumbnailUrl: data.image_url || data.uri,
                prompt: request.prompt,
                width: request.width,
                height: request.height,
                status: 'ready',
                cost: 5, // CREDIT_COSTS.midjourney
                metadata: {
                    jobId: data.id,
                    seed: data.seed,
                    model: 'midjourney-v6'
                },
                createdAt: new Date()
            };
            return {
                success: true,
                asset,
                processingTime: Date.now() - startTime,
                cost: 5
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
    buildPrompt(request) {
        const platformSuffix = request.platform === 'reels' || request.platform === 'tiktok'
            ? ', 9:16 vertical format, phone screen aspect'
            : ', 16:9 landscape format';
        const styleSuffix = request.style
            ? `, ${request.style} style`
            : ', photorealistic, high detail';
        return `${request.prompt}${platformSuffix}${styleSuffix}`;
    }
    async upscale(assetId, scale = 2) {
        // Implementar upscaling
        return {
            success: true,
            asset: undefined,
            cost: 2
        };
    }
}
// ============================================
// DALL-E CLIENT
// ============================================
export class DalleClient {
    constructor(apiKey) {
        this.baseUrl = 'https://api.openai.com/v1';
        this.apiKey = apiKey;
    }
    async generateImage(request) {
        const startTime = Date.now();
        try {
            const response = await fetchWithTimeout(`${this.baseUrl}/images/generations`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'dall-e-3',
                    prompt: request.prompt,
                    size: `${request.width}x${request.height}`,
                    quality: 'standard',
                    n: 1
                })
            });
            if (!response.ok) {
                const error = await response.text();
                throw new Error(`DALL-E API error: ${error}`);
            }
            const data = await response.json();
            const asset = {
                id: `dalle-${Date.now()}`,
                projectId: '',
                sourceType: 'ai_generated',
                sourceProvider: 'dalle',
                sourceUrl: data.data[0].url,
                thumbnailUrl: data.data[0].url,
                prompt: request.prompt,
                width: request.width,
                height: request.height,
                status: 'ready',
                cost: 3,
                metadata: {
                    revisedPrompt: data.data[0].revised_prompt
                },
                createdAt: new Date()
            };
            return {
                success: true,
                asset,
                processingTime: Date.now() - startTime,
                cost: 3
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
}
// ============================================
// FACTORY
// ============================================
export function createImageClient(provider, apiKey) {
    switch (provider) {
        case 'midjourney':
            return new MidjourneyClient(apiKey);
        case 'dalle':
            return new DalleClient(apiKey);
        default:
            throw new Error(`Unknown image provider: ${provider}`);
    }
}
export default {
    MidjourneyClient,
    DalleClient,
    createImageClient
};
