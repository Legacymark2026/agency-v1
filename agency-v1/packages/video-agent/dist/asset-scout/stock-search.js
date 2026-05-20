/**
 * Stock Video API Clients
 * Pexels & Adobe Stock Integration
 */
// ============================================
// PEXELS CLIENT (Free Tier Available)
// ============================================
export class PexelsClient {
    constructor(apiKey) {
        this.baseUrl = 'https://api.pexels.com/v1';
        this.apiKey = apiKey;
    }
    async searchVideos(query, options = {}) {
        var _a;
        try {
            const params = new URLSearchParams({
                query,
                per_page: String(options.perPage || 15),
                page: String(options.page || 1)
            });
            if (options.orientation)
                params.append('orientation', options.orientation);
            if (options.size)
                params.append('size', options.size);
            const response = await fetch(`${this.baseUrl}/videos/search?${params}`, {
                headers: {
                    'Authorization': this.apiKey
                }
            });
            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Pexels API error: ${error}`);
            }
            const data = await response.json();
            const results = ((_a = data.videos) === null || _a === void 0 ? void 0 : _a.map((video) => {
                var _a, _b, _c, _d, _e, _f;
                return ({
                    id: `pexels-${video.id}`,
                    provider: 'pexels',
                    title: ((_a = video.user) === null || _a === void 0 ? void 0 : _a.name) || 'Pexels Video',
                    thumbnailUrl: video.image,
                    videoUrl: (_c = (_b = video.video_files) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.link,
                    duration: video.duration,
                    width: video.width,
                    height: video.height,
                    author: ((_d = video.user) === null || _d === void 0 ? void 0 : _d.name) || 'Unknown',
                    license: 'free',
                    downloadUrl: (_f = (_e = video.video_files) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.link
                });
            })) || [];
            return {
                results,
                totalResults: data.total_results || 0
            };
        }
        catch (error) {
            console.error('Pexels search error:', error);
            return { results: [], totalResults: 0 };
        }
    }
    async getPopularVideos(options = {}) {
        var _a;
        try {
            const response = await fetch(`${this.baseUrl}/videos/popular?per_page=${options.perPage || 15}`, {
                headers: {
                    'Authorization': this.apiKey
                }
            });
            const data = await response.json();
            return ((_a = data.videos) === null || _a === void 0 ? void 0 : _a.map((video) => {
                var _a, _b, _c, _d, _e, _f;
                return ({
                    id: `pexels-${video.id}`,
                    provider: 'pexels',
                    title: ((_a = video.user) === null || _a === void 0 ? void 0 : _a.name) || 'Popular Video',
                    thumbnailUrl: video.image,
                    videoUrl: (_c = (_b = video.video_files) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.link,
                    duration: video.duration,
                    width: video.width,
                    height: video.height,
                    author: ((_d = video.user) === null || _d === void 0 ? void 0 : _d.name) || 'Unknown',
                    license: 'free',
                    downloadUrl: (_f = (_e = video.video_files) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.link
                });
            })) || [];
        }
        catch (error) {
            console.error('Pexels popular error:', error);
            return [];
        }
    }
    async downloadVideo(videoId) {
        // En producción, esto descargaría el video a un storage local/cloud
        return { url: `https://www.pexels.com/video/${videoId}/download/` };
    }
}
// ============================================
// ADOBE STOCK CLIENT (Premium)
// ============================================
export class AdobeStockClient {
    constructor(apiKey) {
        this.baseUrl = 'https://stock.adobe.io';
        this.apiKey = apiKey;
    }
    async searchVideos(query, options = {}) {
        var _a;
        try {
            // Adobe Stock requiere autenticación diferente
            const response = await fetch(`${this.baseUrl}/Search/Videos`, {
                method: 'POST',
                headers: {
                    'x-api-key': this.apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    search_parameters: Object.assign({ query, limit: options.limit || 15, offset: options.offset || 0 }, (options.filters && { filters: options.filters }))
                })
            });
            if (!response.ok) {
                throw new Error(`Adobe Stock API error: ${response.statusText}`);
            }
            const data = await response.json();
            const results = ((_a = data.nb_results) === null || _a === void 0 ? void 0 : _a.map((item) => ({
                id: `adobe-${item.id}`,
                provider: 'adobe_stock',
                title: item.title || 'Adobe Stock Video',
                thumbnailUrl: item.thumbnail_url || item.url,
                videoUrl: item.link,
                duration: item.duration,
                width: item.width,
                height: item.height,
                author: item.creator_name || 'Unknown',
                license: 'premium',
                downloadUrl: item.link
            }))) || [];
            return {
                results,
                totalMatches: data.total_matches || 0
            };
        }
        catch (error) {
            console.error('Adobe Stock search error:', error);
            return { results: [], totalMatches: 0 };
        }
    }
    async getVideoDetails(videoId) {
        try {
            const response = await fetch(`${this.baseUrl}/Video/${videoId}`, {
                headers: {
                    'x-api-key': this.apiKey
                }
            });
            return await response.json();
        }
        catch (error) {
            console.error('Adobe Stock details error:', error);
            return null;
        }
    }
}
// ============================================
// FACTORY
// ============================================
export function createStockClient(provider, apiKey) {
    switch (provider) {
        case 'pexels':
            return new PexelsClient(apiKey);
        case 'adobe_stock':
            return new AdobeStockClient(apiKey);
        default:
            throw new Error(`Unknown stock provider: ${provider}`);
    }
}
// Búsqueda unificada
export async function searchStock(query, provider, apiKey, options) {
    const client = createStockClient(provider, apiKey);
    if (provider === 'pexels') {
        const result = await client.searchVideos(query, options);
        return result;
    }
    else {
        const result = await client.searchVideos(query, options);
        return { results: result.results };
    }
}
export default {
    PexelsClient,
    AdobeStockClient,
    createStockClient,
    searchStock
};
