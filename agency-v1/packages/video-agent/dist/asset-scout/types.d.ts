/**
 * Asset Scout Types - The Multi-Source Engine
 * Tipos para gestión de assets externos y sintetizador
 */
import { Platform } from '../agents/types';
export type AssetSourceType = 'ai_generated' | 'stock' | 'uploaded';
export type AssetProvider = 'midjourney' | 'dalle' | 'sora' | 'runway' | 'luma' | 'pexels' | 'adobe_stock' | 'elevenlabs' | 'suno' | 'uploaded';
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
    duration?: number;
    width?: number;
    height?: number;
    status: AssetStatus;
    cost?: number;
    metadata?: Record<string, any>;
    createdAt: Date;
    appliedAt?: Date;
}
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
    estimatedDuration?: number;
    status: 'pending' | 'approved' | 'rejected' | 'generating' | 'ready' | 'applied';
    asset?: ExternalAsset;
    rejectionReason?: string;
}
export interface SynthesisAudit {
    id: string;
    projectId: string;
    status: 'pending' | 'in_progress' | 'completed';
    scriptLength?: number;
    timelineDuration?: number;
    missingDuration?: number;
    gaps: TimelineGap[];
    proposals: AssetProposal[];
    appliedAssets: string[];
    createdAt: Date;
    updatedAt: Date;
}
export interface StyleProfile {
    sourceVideoId?: string;
    averageColor: string;
    temperature: number;
    contrast: number;
    saturation: number;
    grainLevel: number;
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
export declare const CREDIT_COSTS: Record<AssetProvider, number>;
export interface ExternalCommand {
    type: 'source-external' | 'source-stock' | 'match-style' | 'upscale-pro' | 'synthesize' | 'voice-clone' | 'generate-music';
    rawInput: string;
    prompt?: string;
    source?: AssetProvider;
    options?: Record<string, any>;
}
export interface ApiConfig {
    provider: AssetProvider;
    apiKey?: string;
    isActive: boolean;
    rateLimit?: number;
    quotaLimit?: number;
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
export interface AssetGenerationRequest {
    provider: AssetProvider;
    prompt: string;
    duration?: number;
    width: number;
    height: number;
    platform: Platform;
    style?: string;
    seed?: number;
    negativePrompt?: string;
}
