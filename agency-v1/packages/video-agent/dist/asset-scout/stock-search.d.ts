/**
 * Stock Video API Clients
 * Pexels & Adobe Stock Integration
 */
import { StockSearchResult } from './types';
export declare class PexelsClient {
    private apiKey;
    private baseUrl;
    constructor(apiKey: string);
    searchVideos(query: string, options?: {
        perPage?: number;
        page?: number;
        orientation?: 'landscape' | 'portrait' | 'square';
        size?: 'large' | 'medium' | 'small';
    }): Promise<{
        results: StockSearchResult[];
        totalResults: number;
    }>;
    getPopularVideos(options?: {
        perPage?: number;
    }): Promise<StockSearchResult[]>;
    downloadVideo(videoId: string): Promise<{
        url: string;
        localPath?: string;
    }>;
}
export declare class AdobeStockClient {
    private apiKey;
    private baseUrl;
    constructor(apiKey: string);
    searchVideos(query: string, options?: {
        limit?: number;
        offset?: number;
        filters?: {
            orientation?: 'horizontal' | 'vertical';
            fps?: number;
        };
    }): Promise<{
        results: StockSearchResult[];
        totalMatches: number;
    }>;
    getVideoDetails(videoId: string): Promise<any>;
}
export declare function createStockClient(provider: 'pexels' | 'adobe_stock', apiKey: string): PexelsClient | AdobeStockClient;
export declare function searchStock(query: string, provider: 'pexels' | 'adobe_stock', apiKey: string, options?: any): Promise<{
    results: StockSearchResult[];
}>;
declare const _default: {
    PexelsClient: typeof PexelsClient;
    AdobeStockClient: typeof AdobeStockClient;
    createStockClient: typeof createStockClient;
    searchStock: typeof searchStock;
};
export default _default;
