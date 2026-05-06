/**
 * Asset Scout Types - The Multi-Source Engine
 * Tipos para gestión de assets externos y sintetizador
 */

import { VideoClip, Platform } from '../agents/types';

// ============================================
// TIPOS DE ASSETS EXTERNOS
// ============================================

export type AssetSourceType = 'ai_generated' | 'stock' | 'uploaded';
export type AssetProvider = 
  | 'midjourney' 
  | 'dalle' 
  | 'sora' 
  | 'runway' 
  | 'luma'
  | 'pexels' 
  | 'adobe_stock'
  | 'elevenlabs'
  | 'suno'
  | 'uploaded';

export type AssetStatus = 'pending' | 'generating' | 'downloading' | 'ready' | 'applied' | 'failed';

export interface ExternalAsset {
  id: string;
  projectId: string;
  sourceType: AssetSourceType;
  sourceProvider: AssetProvider;
  sourceUrl?: string;
  localUrl?: string;
  thumbnailUrl?: string;
  prompt?: string;
  duration?: number; // Para videos
  width?: number;
  height?: number;
  status: AssetStatus;
  cost?: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  appliedAt?: Date;
}

// ============================================
// SÍNTETIZADOR - AUDITORÍA
// ============================================

export type GapType = 'b-roll' | 'transition' | 'texture' | 'background' | 'drone' | 'product' | 'ambient';
export type GapSeverity = 'critical' | 'major' | 'minor';
export type ProposedSource = 'ai' | 'stock' | 'mixed' | 'manual';

export interface TimelineGap {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  type: GapType;
  severity: GapSeverity;
  reason: string;
  relatedScript?: string;
}

export interface AssetProposal {
  gapId: string;
  source: ProposedSource;
  provider?: AssetProvider;
  prompt?: string;
  searchQuery?: string;
  estimatedCost: number;
  estimatedDuration?: number; // Tiempo de generación
  status: 'pending' | 'approved' | 'rejected' | 'generating' | 'ready' | 'applied';
  asset?: ExternalAsset;
  rejectionReason?: string;
}

export interface SynthesisAudit {
  id: string;
  projectId: string;
  status: 'pending' | 'in_progress' | 'completed';
  
  // Análisis del guion/timeline
  scriptLength?: number;
  timelineDuration?: number;
  missingDuration?: number;
  
  // Huecos detectados
  gaps: TimelineGap[];
  
  // Propuestas
  proposals: AssetProposal[];
  
  // Resultados
  appliedAssets: string[]; // IDs de ExternalAsset aplicados
  
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// STYLE MATCHER
// ============================================

export interface StyleProfile {
  sourceVideoId?: string;
  averageColor: string; // Hex
  temperature: number; // Kelvin
  contrast: number;
  saturation: number;
  grainLevel: number; // 0-100
  grainType: 'film' | 'digital' | 'none';
  lut?: string;
}

export interface StyleMatchConfig {
  matchTemperature: boolean;
  matchContrast: boolean;
  matchGrain: boolean;
  matchSaturation: boolean;
  colorHarmony: 'complementary' | 'analogous' | 'monochromatic' | 'none';
}

// ============================================
// CRÉDITOS Y COSTOS
// ============================================

export interface CreditBalance {
  companyId: string;
  totalCredits: number;
  usedCredits: number;
  availableCredits: number;
  lastUpdated: Date;
}

export interface CreditTransaction {
  id: string;
  companyId: string;
  projectId?: string;
  action: string;
  amount: number;
  cost: number;
  provider?: AssetProvider;
  status: 'pending' | 'completed' | 'refunded';
  createdAt: Date;
}

// Costos estimados por operación (en créditos)
export const CREDIT_COSTS: Record<AssetProvider, number> = {
  // Imagen
  midjourney: 5,
  dalle: 3,
  
  // Video
  sora: 25,
  runway: 20,
  luma: 18,
  
  // Stock (gratis o bajo costo)
  pexels: 1,
  adobe_stock: 2,
  
  // Audio
  elevenlabs: 3, // Por ~100 caracteres
  suno: 10, // Por ~2 minutos
  
  // Default
  uploaded: 0
};

// ============================================
// COMANDOS EXTERNOS
// ============================================

export interface ExternalCommand {
  type: 'source-external' | 'source-stock' | 'match-style' | 'upscale-pro' | 'synthesize' | 'voice-clone' | 'generate-music';
  rawInput: string;
  prompt?: string;
  source?: AssetProvider;
  options?: Record<string, any>;
}

// ============================================
// CONFIGURACIÓN DE APIS
// ============================================

export interface ApiConfig {
  provider: AssetProvider;
  apiKey?: string;
  isActive: boolean;
  rateLimit?: number; // Por minuto
  quotaLimit?: number; // Por mes
  quotaUsed?: number;
}

export interface CompanyApiKeys {
  companyId: string;
  openai?: ApiConfig;
  midjourney?: ApiConfig;
  pexels?: ApiConfig;
  adobeStock?: ApiConfig;
  elevenlabs?: ApiConfig;
  suno?: ApiConfig;
}

// ============================================
// RESULTADOS DE GENERACIÓN
// ============================================

export interface GenerationResult {
  success: boolean;
  asset?: ExternalAsset;
  error?: string;
  processingTime?: number;
  cost?: number;
}

export interface StockSearchResult {
  id: string;
  provider: 'pexels' | 'adobe_stock';
  title: string;
  thumbnailUrl: string;
  videoUrl?: string;
  duration?: number;
  width: number;
  height: number;
  author: string;
  license: 'free' | 'premium';
  downloadUrl?: string;
}

// ============================================
// PLATAFORMA Y FORMATO
// ============================================

export interface AssetGenerationRequest {
  provider: AssetProvider;
  prompt: string;
  duration?: number; // Para videos
  width: number;
  height: number;
  platform: Platform;
  style?: string;
  seed?: number;
  negativePrompt?: string;
}

// Exportaciones arriba