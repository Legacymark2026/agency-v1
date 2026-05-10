/**
 * ML Predictive Model for Video Retention (TikTok / Reels / Shorts)
 * 
 * Este módulo utiliza una aproximación matemática de Regresión Logística
 * para calcular la probabilidad de retención de audiencia en base a
 * características extraídas de la línea de tiempo del video.
 */

import { prisma } from '@/lib/prisma';

export interface VideoFeatures {
  totalDuration: number;
  hookDuration: number;
  cutsCount: number;
  averageCutDuration: number;
  platform: 'tiktok' | 'reels' | 'youtube' | 'instagram-feed' | 'facebook' | 'multi';
  style: 'cinematic' | 'luxury' | 'viral' | 'corporate' | 'warm-artisan';
  hasSpeedRamps: boolean;
}

export interface PredictionResult {
  score: number;
  expectedRetentionRate: number;
  insights: string[];
}

export interface ModelWeights {
  bias: number;
  cutsRate: number;
  hookWeight: number;
  durationPenalty: number;
}

// Default weights if no company weights exist
const DEFAULT_WEIGHTS: Record<string, ModelWeights> = {
  tiktok: { bias: 0.15, cutsRate: 1.5, hookWeight: 2.0, durationPenalty: -0.01 },
  reels: { bias: 0.15, cutsRate: 1.2, hookWeight: 1.8, durationPenalty: -0.005 },
  youtube: { bias: 0.15, cutsRate: 0.8, hookWeight: 1.2, durationPenalty: -0.001 },
  default: { bias: 0.15, cutsRate: 1.0, hookWeight: 1.0, durationPenalty: -0.005 },
};

function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

// Fetch dynamic weights from Prisma
async function getCompanyWeights(companyId: string, platform: string): Promise<ModelWeights> {
  if (!companyId) return DEFAULT_WEIGHTS[platform] || DEFAULT_WEIGHTS.default;

  const row = await prisma.mLCompanyWeights.findUnique({
    where: { companyId_platform: { companyId, platform } }
  });

  if (row && row.weights) {
    return row.weights as unknown as ModelWeights;
  }
  
  return DEFAULT_WEIGHTS[platform] || DEFAULT_WEIGHTS.default;
}

export async function predictVideoRetention(features: VideoFeatures, companyId?: string): Promise<PredictionResult> {
  const insights: string[] = [];
  
  // 1. Get dynamic weights
  const weights = await getCompanyWeights(companyId || '', features.platform);

  // 2. Calculate Derived Features
  const cutsPerMinute = features.totalDuration > 0 ? (features.cutsCount / features.totalDuration) * 60 : 0;
  
  // Features vector [1, cutsPerMinute, hookDuration, totalDuration]
  let z = weights.bias;

  // Feature A: Pacing
  if (cutsPerMinute > 12) {
    z += weights.cutsRate * 0.8;
  } else if (cutsPerMinute < 5) {
    z -= weights.cutsRate * 0.5;
    insights.push("El ritmo (cuts per minute) es muy bajo. Podría perder audiencia rápido.");
  } else {
    z += weights.cutsRate * 0.4;
  }

  // Feature B: Hook
  if (features.hookDuration <= 3 && features.hookDuration > 0) {
    z += weights.hookWeight * 1.2;
    insights.push("Excelente duración del hook (<3s), ideal para atrapar atención temprana.");
  } else if (features.hookDuration > 5) {
    z -= weights.hookWeight * 0.8;
    insights.push("El hook dura demasiado. Riesgo alto de swipe up en los primeros segundos.");
  }

  // Feature C: Duration
  z += features.totalDuration * weights.durationPenalty;
  
  if (features.totalDuration > 60 && ['tiktok', 'reels'].includes(features.platform)) {
    insights.push("Duración extensa para videos cortos. Asegura mantener el engagement en el Clímax.");
  }

  // Style Impact
  if (features.style === 'viral') {
    z += 0.5; 
    if (cutsPerMinute < 15) {
      insights.push("Estilo 'Viral' pero bajo ritmo de cortes. Hay discrepancia en el formato.");
    }
  } else if (features.style === 'cinematic') {
    if (cutsPerMinute > 25) {
      z -= 0.3;
      insights.push("Estilo 'Cinematic' con demasiados cortes. Puede marear a la audiencia.");
    }
  }

  if (features.hasSpeedRamps) {
    z += 0.4;
    insights.push("Speed ramps detectados: Aumenta la retención visual en el Hook.");
  }

  const probability = sigmoid(z);
  const score = Math.min(100, Math.max(0, Math.round(probability * 100)));
  const expectedRetentionRate = Math.round((probability * 0.75) * 100);

  if (score >= 80) {
    insights.unshift("🚀 Predicción de alta viralidad: Las métricas base son excepcionales.");
  } else if (score >= 60) {
    insights.unshift("✅ Predicción sólida: El video tiene un buen balance técnico.");
  } else {
    insights.unshift("⚠️ Riesgo de abandono: Considera ajustar el Hook o añadir más cortes.");
  }

  return { score, expectedRetentionRate, insights };
}

/**
 * BACKPROPAGATION: Gradient Descent Step
 * Adjusts the weights based on actual retention data
 */
export async function trainModel(companyId: string, projectId: string, features: VideoFeatures, actualRetentionRate: number) {
  const currentWeights = await getCompanyWeights(companyId, features.platform);
  const prediction = await predictVideoRetention(features, companyId);
  
  // Calculate Error (Actual - Predicted)
  const predictedRate = prediction.expectedRetentionRate / 100;
  const actualRate = actualRetentionRate / 100;
  const error = actualRate - predictedRate;
  
  // Hyperparameters
  const learningRate = 0.05; // Alpha
  
  // Features derived
  const cutsPerMinute = features.totalDuration > 0 ? (features.cutsCount / features.totalDuration) * 60 : 0;
  
  // Gradient Descent Adjustment (w = w + alpha * error * x)
  const updatedWeights: ModelWeights = {
    bias: currentWeights.bias + (learningRate * error * 1.0),
    cutsRate: currentWeights.cutsRate + (learningRate * error * cutsPerMinute * 0.01), // normalized x
    hookWeight: currentWeights.hookWeight + (learningRate * error * (features.hookDuration <= 3 ? 1.2 : -0.8)),
    durationPenalty: currentWeights.durationPenalty + (learningRate * error * features.totalDuration * 0.01)
  };

  // Upsert into Prisma DB
  await prisma.mLCompanyWeights.upsert({
    where: { companyId_platform: { companyId, platform: features.platform } },
    update: { weights: updatedWeights as any },
    create: { companyId, platform: features.platform, weights: updatedWeights as any }
  });

  // Log performance
  await prisma.videoPerformanceLog.create({
    data: {
      projectId,
      predictedScore: prediction.score,
      actualScore: actualRetentionRate,
      retentionRate: actualRetentionRate,
      views: 1000 // Mock views for now
    }
  });

  return updatedWeights;
}
