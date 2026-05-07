export interface VideoAssetConfig {
  midjourney?: { apiKey: string; isActive: boolean };
  pexels?: { apiKey: string; isActive: boolean };
  adobeStock?: { clientId: string; clientSecret: string; isActive: boolean };
  elevenlabs?: { apiKey: string; isActive: boolean };
  suno?: { apiKey: string; isActive: boolean };
  runway?: { apiKey: string; isActive: boolean };
  luma?: { apiKey: string; isActive: boolean };
}

export interface VideoAssetStatus {
  provider: string;
  isConfigured: boolean;
  lastTested?: Date;
  status: 'connected' | 'disconnected' | 'error';
  error?: string;
}