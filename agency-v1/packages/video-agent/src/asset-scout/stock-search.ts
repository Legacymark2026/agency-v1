/**
 * Stock Video API Clients
 * Pexels & Adobe Stock Integration
 */

import { StockSearchResult, AssetProvider } from './types';

// ============================================
// PEXELS CLIENT (Free Tier Available)
// ============================================

export class PexelsClient {
  private apiKey: string;
  private baseUrl = 'https://api.pexels.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchVideos(
    query: string, 
    options: {
      perPage?: number;
      page?: number;
      orientation?: 'landscape' | 'portrait' | 'square';
      size?: 'large' | 'medium' | 'small';
    } = {}
  ): Promise<{ results: StockSearchResult[]; totalResults: number }> {
    try {
      const params = new URLSearchParams({
        query,
        per_page: String(options.perPage || 15),
        page: String(options.page || 1)
      });

      if (options.orientation) params.append('orientation', options.orientation);
      if (options.size) params.append('size', options.size);

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
      
      const results: StockSearchResult[] = data.videos?.map((video: any) => ({
        id: `pexels-${video.id}`,
        provider: 'pexels',
        title: video.user?.name || 'Pexels Video',
        thumbnailUrl: video.image,
        videoUrl: video.video_files?.[0]?.link,
        duration: video.duration,
        width: video.width,
        height: video.height,
        author: video.user?.name || 'Unknown',
        license: 'free',
        downloadUrl: video.video_files?.[0]?.link
      })) || [];

      return {
        results,
        totalResults: data.total_results || 0
      };

    } catch (error: any) {
      console.error('Pexels search error:', error);
      return { results: [], totalResults: 0 };
    }
  }

  async getPopularVideos(options: { perPage?: number } = {}): Promise<StockSearchResult[]> {
    try {
      const response = await fetch(`${this.baseUrl}/videos/popular?per_page=${options.perPage || 15}`, {
        headers: {
          'Authorization': this.apiKey
        }
      });

      const data = await response.json();
      
      return data.videos?.map((video: any) => ({
        id: `pexels-${video.id}`,
        provider: 'pexels',
        title: video.user?.name || 'Popular Video',
        thumbnailUrl: video.image,
        videoUrl: video.video_files?.[0]?.link,
        duration: video.duration,
        width: video.width,
        height: video.height,
        author: video.user?.name || 'Unknown',
        license: 'free',
        downloadUrl: video.video_files?.[0]?.link
      })) || [];

    } catch (error: any) {
      console.error('Pexels popular error:', error);
      return [];
    }
  }

  async downloadVideo(videoId: string): Promise<{ url: string; localPath?: string }> {
    // En producción, esto descargaría el video a un storage local/cloud
    return { url: `https://www.pexels.com/video/${videoId}/download/` };
  }
}

// ============================================
// ADOBE STOCK CLIENT (Premium)
// ============================================

export class AdobeStockClient {
  private apiKey: string;
  private baseUrl = 'https://stock.adobe.io';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchVideos(
    query: string,
    options: {
      limit?: number;
      offset?: number;
      filters?: {
        orientation?: 'horizontal' | 'vertical';
        fps?: number;
      };
    } = {}
  ): Promise<{ results: StockSearchResult[]; totalMatches: number }> {
    try {
      // Adobe Stock requiere autenticación diferente
      const response = await fetch(`${this.baseUrl}/Search/Videos`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          search_parameters: {
            query,
            limit: options.limit || 15,
            offset: options.offset || 0,
            ...(options.filters && { filters: options.filters })
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Adobe Stock API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      const results: StockSearchResult[] = data.nb_results?.map((item: any) => ({
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
      })) || [];

      return {
        results,
        totalMatches: data.total_matches || 0
      };

    } catch (error: any) {
      console.error('Adobe Stock search error:', error);
      return { results: [], totalMatches: 0 };
    }
  }

  async getVideoDetails(videoId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/Video/${videoId}`, {
        headers: {
          'x-api-key': this.apiKey
        }
      });

      return await response.json();
    } catch (error) {
      console.error('Adobe Stock details error:', error);
      return null;
    }
  }
}

// ============================================
// FACTORY
// ============================================

export function createStockClient(provider: 'pexels' | 'adobe_stock', apiKey: string) {
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
export async function searchStock(
  query: string,
  provider: 'pexels' | 'adobe_stock',
  apiKey: string,
  options?: any
): Promise<{ results: StockSearchResult[] }> {
  const client = createStockClient(provider, apiKey);
  
  if (provider === 'pexels') {
    const result = await (client as PexelsClient).searchVideos(query, options);
    return result;
  } else {
    const result = await (client as AdobeStockClient).searchVideos(query, options);
    return { results: result.results };
  }
}

export default {
  PexelsClient,
  AdobeStockClient,
  createStockClient,
  searchStock
};