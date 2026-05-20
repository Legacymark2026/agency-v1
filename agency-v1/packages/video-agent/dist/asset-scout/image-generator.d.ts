/**
 * Image Generator API Clients
 * Midjourney & DALL-E Integration
 */
import { AssetGenerationRequest, GenerationResult } from './types';
export declare class MidjourneyClient {
    private apiKey;
    private baseUrl;
    constructor(apiKey: string);
    generateImage(request: AssetGenerationRequest): Promise<GenerationResult>;
    private buildPrompt;
    upscale(assetId: string, scale?: 2 | 4): Promise<GenerationResult>;
}
export declare class DalleClient {
    private apiKey;
    private baseUrl;
    constructor(apiKey: string);
    generateImage(request: AssetGenerationRequest): Promise<GenerationResult>;
}
export declare function createImageClient(provider: 'midjourney' | 'dalle', apiKey: string): MidjourneyClient | DalleClient;
declare const _default: {
    MidjourneyClient: typeof MidjourneyClient;
    DalleClient: typeof DalleClient;
    createImageClient: typeof createImageClient;
};
export default _default;
