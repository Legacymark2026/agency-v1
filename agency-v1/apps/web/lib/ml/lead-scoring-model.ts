/**
 * Predictive Lead Scoring Engine
 *
 * Utiliza una simulación de Regresión Logística Múltiple para evaluar
 * la probabilidad de conversión de un Lead basándose en su origen,
 * exhaustividad de datos y parámetros de seguimiento publicitario (CAPI).
 */

export interface LeadFeatures {
  source: string;
  hasEmail: boolean;
  hasPhone: boolean;
  hasName: boolean;
  hasCompany: boolean;
  hasFacebookClickId: boolean; // fbc, fbclid
  hasGoogleClickId: boolean;   // gclid
  hasLinkedInClickId: boolean; // li_fat_id
  hasTikTokClickId: boolean;   // ttclid
}

export interface LeadPredictionResult {
  probability: number;      // 0.0 to 1.0
  score: number;            // 0 to 100
  factors: Record<string, any>;
}

// Pesos del modelo de scoring
const MODEL_WEIGHTS = {
  bias: -2.5, // Base barrier to entry
  
  // Data completeness weights
  contactData: {
    email: 1.0,
    phone: 1.5,
    name: 0.5,
    company: 0.8
  },
  
  // Source quality weights
  source: {
    'organic': 1.5,
    'referral': 2.0,
    'inbound': 1.2,
    'social_media': 0.8,
    'cold_email': -0.5,
    'cold_call': -0.3,
    'default': 0.0
  },
  
  // High-intent tracking signals (Click IDs mean they interacted with a paid ad)
  tracking: {
    gclid: 1.8, // Google Search usually implies highest intent
    fbclid: 1.2,
    li_fat_id: 1.5, // B2B high intent
    ttclid: 0.9
  }
};

function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

export function predictLeadConversion(features: LeadFeatures): LeadPredictionResult {
  let z = MODEL_WEIGHTS.bias;
  const factors: Record<string, any> = { positives: [], negatives: [] };

  // 1. Data Completeness
  if (features.hasEmail) {
    z += MODEL_WEIGHTS.contactData.email;
    factors.positives.push("Email proporcionado");
  } else {
    factors.negatives.push("Falta email de contacto");
  }

  if (features.hasPhone) {
    z += MODEL_WEIGHTS.contactData.phone;
    factors.positives.push("Teléfono proporcionado (Alta intención)");
  } else {
    factors.negatives.push("Falta número de teléfono");
  }

  if (features.hasName) z += MODEL_WEIGHTS.contactData.name;
  if (features.hasCompany) {
    z += MODEL_WEIGHTS.contactData.company;
    factors.positives.push("Perfil B2B identificado");
  }

  // 2. Source Evaluation
  const normalizedSource = features.source.toLowerCase().replace(' ', '_');
  let sourceWeight = MODEL_WEIGHTS.source.default;
  
  if (normalizedSource.includes('organic')) sourceWeight = MODEL_WEIGHTS.source.organic;
  else if (normalizedSource.includes('referral')) sourceWeight = MODEL_WEIGHTS.source.referral;
  else if (normalizedSource.includes('cold')) sourceWeight = MODEL_WEIGHTS.source.cold_email;
  else if (normalizedSource.includes('inbound') || normalizedSource.includes('website')) sourceWeight = MODEL_WEIGHTS.source.inbound;
  
  z += sourceWeight;
  
  if (sourceWeight > 1) {
    factors.positives.push(`Origen de alta calidad: ${features.source}`);
  } else if (sourceWeight < 0) {
    factors.negatives.push(`Origen de baja conversión histórica: ${features.source}`);
  }

  // 3. Tracking Signals (High Intent)
  if (features.hasGoogleClickId) {
    z += MODEL_WEIGHTS.tracking.gclid;
    factors.positives.push("Tráfico de Google Ads (Búsqueda por intención)");
  }
  if (features.hasFacebookClickId) {
    z += MODEL_WEIGHTS.tracking.fbclid;
    factors.positives.push("Tráfico de Meta Ads");
  }
  if (features.hasLinkedInClickId) {
    z += MODEL_WEIGHTS.tracking.li_fat_id;
    factors.positives.push("Tráfico B2B de LinkedIn Ads");
  }
  if (features.hasTikTokClickId) {
    z += MODEL_WEIGHTS.tracking.ttclid;
  }

  // Calculate Probability
  const probability = sigmoid(z);
  const score = Math.round(probability * 100);

  return {
    probability,
    score,
    factors
  };
}
