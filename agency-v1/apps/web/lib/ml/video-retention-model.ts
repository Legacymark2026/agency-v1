/**
 * ML Predictive Model for Video Retention (TikTok / Reels / Shorts)
 * 
 * Este módulo utiliza una aproximación matemática de Regresión Logística
 * para calcular la probabilidad de retención de audiencia en base a
 * características extraídas de la línea de tiempo del video.
 */

export interface VideoFeatures {
  totalDuration: number;      // Duración en segundos
  hookDuration: number;       // Duración del gancho
  cutsCount: number;          // Cantidad total de cortes
  averageCutDuration: number; // Duración promedio de los cortes
  platform: 'tiktok' | 'reels' | 'youtube' | 'instagram-feed' | 'facebook' | 'multi';
  style: 'cinematic' | 'luxury' | 'viral' | 'corporate' | 'warm-artisan';
  hasSpeedRamps: boolean;
}

export interface PredictionResult {
  score: number;             // Probabilidad de éxito / retención (0 a 100)
  expectedRetentionRate: number; // Porcentaje de personas que verán más del 50%
  insights: string[];        // Observaciones generadas por los pesos del modelo
}

// Pesos pre-entrenados simulados para el modelo logístico
const MODEL_WEIGHTS = {
  bias: 0.15,
  tiktok: { cutsRate: 1.5, hookWeight: 2.0, durationPenalty: -0.01 },
  reels: { cutsRate: 1.2, hookWeight: 1.8, durationPenalty: -0.005 },
  youtube: { cutsRate: 0.8, hookWeight: 1.2, durationPenalty: -0.001 },
  default: { cutsRate: 1.0, hookWeight: 1.0, durationPenalty: -0.005 },
};

/**
 * Función Sigmoide para la Regresión Logística
 * Mapea cualquier número a un valor entre 0 y 1.
 */
function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

export function predictVideoRetention(features: VideoFeatures): PredictionResult {
  const insights: string[] = [];
  
  // 1. Extraer pesos específicos de la plataforma
  const weights = MODEL_WEIGHTS[features.platform as keyof typeof MODEL_WEIGHTS] || MODEL_WEIGHTS.default;

  // 2. Calcular Features Derivados
  const cutsPerMinute = features.totalDuration > 0 ? (features.cutsCount / features.totalDuration) * 60 : 0;
  const hookRatio = features.totalDuration > 0 ? features.hookDuration / features.totalDuration : 0;

  let z = MODEL_WEIGHTS.bias;

  // Feature A: Ritmo (Cuts per minute)
  // Óptimo viral suele estar entre 15 y 30 CPM
  if (cutsPerMinute > 12) {
    z += weights.cutsRate * 0.8;
  } else if (cutsPerMinute < 5) {
    z -= weights.cutsRate * 0.5;
    insights.push("El ritmo (cuts per minute) es muy bajo. Podría perder audiencia rápido.");
  } else {
    z += weights.cutsRate * 0.4;
  }

  // Feature B: Gancho (Hook Ratio & Duration)
  // Un gancho de menos de 3s es ideal para TikTok/Reels
  if (features.hookDuration <= 3 && features.hookDuration > 0) {
    z += weights.hookWeight * 1.2;
    insights.push("Excelente duración del hook (<3s), ideal para atrapar atención temprana.");
  } else if (features.hookDuration > 5) {
    z -= weights.hookWeight * 0.8;
    insights.push("El hook dura demasiado. Riesgo alto de swipe up en los primeros segundos.");
  }

  // Feature C: Penalización por duración según plataforma
  // Videos largos en TikTok sufren si el ritmo no es alto
  z += features.totalDuration * weights.durationPenalty;
  
  if (features.totalDuration > 60 && ['tiktok', 'reels'].includes(features.platform)) {
    insights.push("Duración extensa para videos cortos. Asegura mantener el engagement en el Clímax.");
  }

  // Feature D: Impacto del Estilo y Modificadores (One-hot encoding logic)
  if (features.style === 'viral') {
    z += 0.5; // Boost natural de atención inicial
    if (cutsPerMinute < 15) {
      insights.push("Estilo 'Viral' pero bajo ritmo de cortes. Hay discrepancia en el formato.");
    }
  } else if (features.style === 'cinematic') {
    // Cinematic se beneficia menos del pacing frenético
    if (cutsPerMinute > 25) {
      z -= 0.3;
      insights.push("Estilo 'Cinematic' con demasiados cortes. Puede marear a la audiencia.");
    }
  }

  // Modificadores Técnicos (Speed Ramps suben la retención)
  if (features.hasSpeedRamps) {
    z += 0.4;
    insights.push("Speed ramps detectados: Aumenta la retención visual en el Hook.");
  }

  // 3. Pasar por la función de activación (Sigmoide)
  const probability = sigmoid(z);
  
  // 4. Mapear a Score (0-100)
  const score = Math.min(100, Math.max(0, Math.round(probability * 100)));
  
  // 5. Mapear a Tasa de Retención Esperada (Regresión Lineal simple desde el Sigmoide)
  // Asumimos un techo de retención del 75% para la métrica "Visto más del 50%"
  const expectedRetentionRate = Math.round((probability * 0.75) * 100);

  if (score >= 80) {
    insights.unshift("🚀 Predicción de alta viralidad: Las métricas base son excepcionales.");
  } else if (score >= 60) {
    insights.unshift("✅ Predicción sólida: El video tiene un buen balance técnico.");
  } else {
    insights.unshift("⚠️ Riesgo de abandono: Considera ajustar el Hook o añadir más cortes.");
  }

  return {
    score,
    expectedRetentionRate,
    insights
  };
}
